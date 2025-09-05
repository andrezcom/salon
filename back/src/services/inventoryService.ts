import mongoose from 'mongoose';
import Product from '../models/product';
import PurchaseOrder from '../models/purchaseOrder';

export class InventoryService {
  
  // Actualizar inventario cuando se reciben productos de una orden de compra
  static async updateInventoryFromPurchaseOrder(
    businessId: string, 
    purchaseOrderId: string, 
    itemsReceived: Array<{productId: string, quantity: number}>
  ): Promise<{success: boolean, updatedProducts: any[], errors: string[]}> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const updatedProducts = [];
      const errors = [];
      
      // Obtener la orden de compra
      const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId).session(session);
      if (!purchaseOrder) {
        throw new Error('Orden de compra no encontrada');
      }
      
      // Procesar cada producto recibido
      for (const receivedItem of itemsReceived) {
        try {
          // Buscar el producto en el inventario
          const product = await Product.findOne({
            _id: receivedItem.productId,
            businessId
          }).session(session);
          
          if (!product) {
            errors.push(`Producto ${receivedItem.productId} no encontrado en el inventario`);
            continue;
          }
          
          // Actualizar el stock
          const newStock = product.inventory.currentStock + receivedItem.quantity;
          
          // Verificar si excede el stock máximo
          if (newStock > product.inventory.maximumStock) {
            errors.push(`Producto ${product.name} excede el stock máximo (${product.inventory.maximumStock})`);
          }
          
          // Actualizar el producto
          await Product.findByIdAndUpdate(
            product._id,
            {
              $inc: { 'inventory.currentStock': receivedItem.quantity },
              $set: { 
                'costPrice': purchaseOrder.items.find(item => 
                  item.productId.toString() === receivedItem.productId
                )?.unitPrice || product.costPrice,
                updatedAt: new Date()
              }
            },
            { session }
          );
          
          updatedProducts.push({
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            quantityReceived: receivedItem.quantity,
            newStock: newStock,
            previousStock: product.inventory.currentStock
          });
          
        } catch (error) {
          errors.push(`Error actualizando producto ${receivedItem.productId}: ${error.message}`);
        }
      }
      
      // Actualizar la orden de compra
      await purchaseOrder.receiveItems(itemsReceived);
      await purchaseOrder.save({ session });
      
      await session.commitTransaction();
      
      return {
        success: errors.length === 0,
        updatedProducts,
        errors
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Crear entrada de inventario manual
  static async createInventoryEntry(
    businessId: string,
    productId: string,
    quantity: number,
    costPrice: number,
    reason: 'purchase' | 'adjustment' | 'return' | 'transfer',
    notes?: string,
    createdBy?: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const product = await Product.findOne({
        _id: productId,
        businessId
      }).session(session);
      
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      const newStock = product.inventory.currentStock + quantity;
      
      // Actualizar el producto
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $inc: { 'inventory.currentStock': quantity },
          $set: { 
            costPrice: costPrice,
            updatedAt: new Date()
          }
        },
        { session, new: true }
      );
      
      // Crear registro de movimiento de inventario
      const inventoryMovement = {
        businessId,
        productId,
        productName: product.name,
        sku: product.sku,
        movementType: reason,
        quantity: quantity,
        costPrice: costPrice,
        previousStock: product.inventory.currentStock,
        newStock: newStock,
        notes: notes,
        createdBy: createdBy,
        createdAt: new Date()
      };
      
      // Guardar el movimiento (aquí podrías crear un modelo InventoryMovement)
      // Por ahora lo retornamos en la respuesta
      
      await session.commitTransaction();
      
      return {
        success: true,
        product: updatedProduct,
        inventoryMovement
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Obtener productos con stock bajo
  static async getLowStockProducts(businessId: string): Promise<any[]> {
    return await Product.find({
      businessId,
      $expr: {
        $lte: ['$inventory.currentStock', '$inventory.minimumStock']
      }
    }).select('name sku inventory.currentStock inventory.minimumStock inventory.reorderPoint');
  }
  
  // Obtener productos que necesitan reorden
  static async getReorderProducts(businessId: string): Promise<any[]> {
    return await Product.find({
      businessId,
      $expr: {
        $lte: ['$inventory.currentStock', '$inventory.reorderPoint']
      }
    }).select('name sku inventory.currentStock inventory.reorderPoint inventory.reorderQuantity');
  }
  
  // Ajustar inventario (para correcciones manuales)
  static async adjustInventory(
    businessId: string,
    productId: string,
    adjustmentQuantity: number,
    reason: string,
    notes?: string,
    adjustedBy?: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const product = await Product.findOne({
        _id: productId,
        businessId
      }).session(session);
      
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      const newStock = product.inventory.currentStock + adjustmentQuantity;
      
      if (newStock < 0) {
        throw new Error('El ajuste resultaría en stock negativo');
      }
      
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $inc: { 'inventory.currentStock': adjustmentQuantity },
          $set: { updatedAt: new Date() }
        },
        { session, new: true }
      );
      
      const inventoryAdjustment = {
        businessId,
        productId,
        productName: product.name,
        sku: product.sku,
        adjustmentType: adjustmentQuantity > 0 ? 'increase' : 'decrease',
        adjustmentQuantity: Math.abs(adjustmentQuantity),
        previousStock: product.inventory.currentStock,
        newStock: newStock,
        reason: reason,
        notes: notes,
        adjustedBy: adjustedBy,
        adjustedAt: new Date()
      };
      
      await session.commitTransaction();
      
      return {
        success: true,
        product: updatedProduct,
        inventoryAdjustment
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Obtener resumen de inventario
  static async getInventorySummary(businessId: string): Promise<any> {
    const summary = await Product.aggregate([
      { $match: { businessId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: {
            $sum: {
              $multiply: ['$inventory.currentStock', '$costPrice']
            }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ['$inventory.currentStock', '$inventory.minimumStock'] },
                1,
                0
              ]
            }
          },
          reorderProducts: {
            $sum: {
              $cond: [
                { $lte: ['$inventory.currentStock', '$inventory.reorderPoint'] },
                1,
                0
              ]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [
                { $eq: ['$inventory.currentStock', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    return summary[0] || {
      totalProducts: 0,
      totalStockValue: 0,
      lowStockProducts: 0,
      reorderProducts: 0,
      outOfStockProducts: 0
    };
  }
}
