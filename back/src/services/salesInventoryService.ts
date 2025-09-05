import mongoose from 'mongoose';
import Product from '../models/product';
import Sale from '../models/sale';

export class SalesInventoryService {
  
  // Actualizar inventario cuando se realiza una venta
  static async updateInventoryFromSale(
    businessId: string, 
    saleId: string
  ): Promise<{success: boolean, updatedProducts: any[], errors: string[]}> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const updatedProducts = [];
      const errors = [];
      
      // Obtener la venta
      const sale = await Sale.findById(saleId).session(session);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }
      
      // Procesar insumos utilizados en servicios
      if (sale.services && sale.services.length > 0) {
        for (const service of sale.services) {
          if (service.input && service.input.length > 0) {
            for (const input of service.input) {
              try {
                // Buscar el producto por nombre (ya que inputId es number)
                const product = await Product.findOne({
                  name: input.nameProduct,
                  businessId,
                  'uses.isInput': true
                }).session(session);
                
                if (!product) {
                  errors.push(`Producto insumo "${input.nameProduct}" no encontrado`);
                  continue;
                }
                
                // Calcular cantidad a descontar (convertir de ml/gr a unidades)
                const quantityToDeduct = this.calculateInputQuantity(
                  input.qty,
                  product.packageInfo.unitSize,
                  product.packageInfo.unitType
                );
                
                // Verificar stock disponible
                if (product.inventory.currentStock < quantityToDeduct) {
                  errors.push(`Stock insuficiente para ${product.name}. Disponible: ${product.inventory.currentStock}, Requerido: ${quantityToDeduct}`);
                  continue;
                }
                
                // Actualizar el producto
                await Product.findByIdAndUpdate(
                  product._id,
                  {
                    $inc: { 'inventory.currentStock': -quantityToDeduct },
                    $set: { updatedAt: new Date() }
                  },
                  { session }
                );
                
                updatedProducts.push({
                  productId: product._id,
                  productName: product.name,
                  sku: product.sku,
                  quantityUsed: quantityToDeduct,
                  inputQuantity: input.qty,
                  inputUnit: product.packageInfo.unitType,
                  newStock: product.inventory.currentStock - quantityToDeduct,
                  previousStock: product.inventory.currentStock,
                  type: 'input'
                });
                
              } catch (error) {
                errors.push(`Error actualizando insumo ${input.nameProduct}: ${error.message}`);
              }
            }
          }
        }
      }
      
      // Procesar ventas al detalle (retail)
      if (sale.retail && sale.retail.length > 0) {
        for (const retail of sale.retail) {
          try {
            // Buscar el producto por ID
            const product = await Product.findOne({
              _id: retail.productId,
              businessId,
              'uses.isRetail': true
            }).session(session);
            
            if (!product) {
              errors.push(`Producto retail con ID ${retail.productId} no encontrado`);
              continue;
            }
            
            // Verificar stock disponible
            if (product.inventory.currentStock < retail.qty) {
              errors.push(`Stock insuficiente para ${product.name}. Disponible: ${product.inventory.currentStock}, Requerido: ${retail.qty}`);
              continue;
            }
            
            // Actualizar el producto
            await Product.findByIdAndUpdate(
              product._id,
              {
                $inc: { 'inventory.currentStock': -retail.qty },
                $set: { updatedAt: new Date() }
              },
              { session }
            );
            
            updatedProducts.push({
              productId: product._id,
              productName: product.name,
              sku: product.sku,
              quantitySold: retail.qty,
              unitPrice: retail.clientPrice,
              totalAmount: retail.amount,
              newStock: product.inventory.currentStock - retail.qty,
              previousStock: product.inventory.currentStock,
              type: 'retail'
            });
            
          } catch (error) {
            errors.push(`Error actualizando producto retail ${retail.productId}: ${error.message}`);
          }
        }
      }
      
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
  
  // Calcular cantidad de unidades a descontar basado en el uso como insumo
  private static calculateInputQuantity(
    inputQuantity: number, 
    unitSize: number, 
    unitType: string
  ): number {
    // Si el insumo se usa en la misma unidad que el empaque, descontar 1 unidad
    if (inputQuantity >= unitSize) {
      return Math.ceil(inputQuantity / unitSize);
    }
    
    // Si es una cantidad pequeña (por ejemplo, 50ml de un producto de 500ml)
    // Descontar 1 unidad por cada uso significativo
    const usagePercentage = inputQuantity / unitSize;
    if (usagePercentage >= 0.1) { // Si usa más del 10% de la unidad
      return 1;
    }
    
    // Para cantidades muy pequeñas, no descontar unidades completas
    // pero registrar el uso para análisis
    return 0;
  }
  
  // Revertir actualización de inventario (para cancelaciones)
  static async revertInventoryFromSale(
    businessId: string, 
    saleId: string
  ): Promise<{success: boolean, revertedProducts: any[], errors: string[]}> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const revertedProducts = [];
      const errors = [];
      
      // Obtener la venta
      const sale = await Sale.findById(saleId).session(session);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }
      
      // Revertir insumos utilizados en servicios
      if (sale.services && sale.services.length > 0) {
        for (const service of sale.services) {
          if (service.input && service.input.length > 0) {
            for (const input of service.input) {
              try {
                const product = await Product.findOne({
                  name: input.nameProduct,
                  businessId,
                  'uses.isInput': true
                }).session(session);
                
                if (!product) {
                  errors.push(`Producto insumo "${input.nameProduct}" no encontrado`);
                  continue;
                }
                
                const quantityToRestore = this.calculateInputQuantity(
                  input.qty,
                  product.packageInfo.unitSize,
                  product.packageInfo.unitType
                );
                
                // Restaurar el stock
                await Product.findByIdAndUpdate(
                  product._id,
                  {
                    $inc: { 'inventory.currentStock': quantityToRestore },
                    $set: { updatedAt: new Date() }
                  },
                  { session }
                );
                
                revertedProducts.push({
                  productId: product._id,
                  productName: product.name,
                  sku: product.sku,
                  quantityRestored: quantityToRestore,
                  newStock: product.inventory.currentStock + quantityToRestore,
                  previousStock: product.inventory.currentStock,
                  type: 'input'
                });
                
              } catch (error) {
                errors.push(`Error revirtiendo insumo ${input.nameProduct}: ${error.message}`);
              }
            }
          }
        }
      }
      
      // Revertir ventas al detalle
      if (sale.retail && sale.retail.length > 0) {
        for (const retail of sale.retail) {
          try {
            const product = await Product.findOne({
              _id: retail.productId,
              businessId,
              'uses.isRetail': true
            }).session(session);
            
            if (!product) {
              errors.push(`Producto retail con ID ${retail.productId} no encontrado`);
              continue;
            }
            
            // Restaurar el stock
            await Product.findByIdAndUpdate(
              product._id,
              {
                $inc: { 'inventory.currentStock': retail.qty },
                $set: { updatedAt: new Date() }
              },
              { session }
            );
            
            revertedProducts.push({
              productId: product._id,
              productName: product.name,
              sku: product.sku,
              quantityRestored: retail.qty,
              newStock: product.inventory.currentStock + retail.qty,
              previousStock: product.inventory.currentStock,
              type: 'retail'
            });
            
          } catch (error) {
            errors.push(`Error revirtiendo producto retail ${retail.productId}: ${error.message}`);
          }
        }
      }
      
      await session.commitTransaction();
      
      return {
        success: errors.length === 0,
        revertedProducts,
        errors
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Obtener productos con stock bajo después de una venta
  static async getLowStockAfterSale(businessId: string): Promise<any[]> {
    return await Product.find({
      businessId,
      $expr: {
        $lte: ['$inventory.currentStock', '$inventory.minimumStock']
      }
    }).select('name sku inventory.currentStock inventory.minimumStock');
  }
  
  // Calcular impacto de una venta en el inventario
  static async calculateSaleImpact(
    businessId: string,
    saleData: any
  ): Promise<{canProcess: boolean, impact: any[], warnings: string[]}> {
    const impact = [];
    const warnings = [];
    let canProcess = true;
    
    // Analizar insumos
    if (saleData.services && saleData.services.length > 0) {
      for (const service of saleData.services) {
        if (service.input && service.input.length > 0) {
          for (const input of service.input) {
            const product = await Product.findOne({
              name: input.nameProduct,
              businessId,
              'uses.isInput': true
            });
            
            if (product) {
              const quantityToDeduct = this.calculateInputQuantity(
                input.qty,
                product.packageInfo.unitSize,
                product.packageInfo.unitType
              );
              
              const newStock = product.inventory.currentStock - quantityToDeduct;
              
              impact.push({
                productId: product._id,
                productName: product.name,
                type: 'input',
                quantityUsed: quantityToDeduct,
                currentStock: product.inventory.currentStock,
                newStock: newStock,
                willBeLowStock: newStock <= product.inventory.minimumStock
              });
              
              if (newStock < 0) {
                canProcess = false;
                warnings.push(`Stock insuficiente para ${product.name}`);
              } else if (newStock <= product.inventory.minimumStock) {
                warnings.push(`${product.name} quedará con stock bajo`);
              }
            }
          }
        }
      }
    }
    
    // Analizar retail
    if (saleData.retail && saleData.retail.length > 0) {
      for (const retail of saleData.retail) {
        const product = await Product.findOne({
          _id: retail.productId,
          businessId,
          'uses.isRetail': true
        });
        
        if (product) {
          const newStock = product.inventory.currentStock - retail.qty;
          
          impact.push({
            productId: product._id,
            productName: product.name,
            type: 'retail',
            quantitySold: retail.qty,
            currentStock: product.inventory.currentStock,
            newStock: newStock,
            willBeLowStock: newStock <= product.inventory.minimumStock
          });
          
          if (newStock < 0) {
            canProcess = false;
            warnings.push(`Stock insuficiente para ${product.name}`);
          } else if (newStock <= product.inventory.minimumStock) {
            warnings.push(`${product.name} quedará con stock bajo`);
          }
        }
      }
    }
    
    return {
      canProcess,
      impact,
      warnings
    };
  }
}
