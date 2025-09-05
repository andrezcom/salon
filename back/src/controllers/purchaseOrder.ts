import { Request, Response } from 'express';
import PurchaseOrder from '../models/purchaseOrder';
import Supplier from '../models/supplier';
import Product from '../models/product';
import { InventoryService } from '../services/inventoryService';

export class PurchaseOrderController {
  
  // Crear orden de compra
  static async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        supplierId,
        expectedDeliveryDate,
        items,
        delivery,
        terms,
        notes
      } = req.body;

      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      // Verificar que el proveedor existe
      const supplier = await Supplier.findOne({ _id: supplierId, businessId });
      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      // Verificar que los productos existen
      const productIds = items.map((item: any) => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        businessId,
        isActive: true
      });

      if (products.length !== productIds.length) {
        res.status(400).json({
          success: false,
          message: 'Uno o más productos no fueron encontrados'
        });
        return;
      }

      // Calcular totales
      let subtotal = 0;
      const processedItems = items.map((item: any) => {
        const product = products.find(p => p._id.toString() === item.productId);
        const totalPrice = item.quantity * item.unitPrice;
        subtotal += totalPrice;
        
        return {
          productId: item.productId,
          productName: product?.name || '',
          productSku: product?.sku || '',
          quantity: item.quantity,
          quantityReceived: 0,
          unitPrice: item.unitPrice,
          totalPrice,
          notes: item.notes || ''
        };
      });

      const taxAmount = subtotal * 0.19; // IVA 19%
      const discountAmount = 0;
      const shippingCost = delivery?.shippingCost || 0;
      const totalAmount = subtotal + taxAmount + discountAmount + shippingCost;

      const purchaseOrder = new PurchaseOrder({
        businessId,
        supplierId,
        supplierName: supplier.name,
        supplierCode: supplier.code,
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        status: 'draft',
        subtotal,
        taxAmount,
        discountAmount,
        shippingCost,
        totalAmount,
        items: processedItems,
        delivery: delivery || {
          method: 'delivery',
          address: '',
          contactPerson: '',
          contactPhone: '',
          specialInstructions: ''
        },
        terms: terms || {
          paymentTerms: 30,
          deliveryTerms: 'FOB',
          warranty: '',
          returnPolicy: ''
        },
        notes,
        createdBy
      });

      await purchaseOrder.save();

      res.status(201).json({
        success: true,
        message: 'Orden de compra creada exitosamente',
        data: purchaseOrder
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener órdenes de compra
  static async getPurchaseOrders(req: Request, res: Response): Promise<void> {
    try {
      const {
        businessId,
        supplierId,
        status,
        page = 1,
        limit = 10,
        startDate,
        endDate
      } = req.query;

      const businessIdFilter = businessId || req.user?.businessId;
      
      if (!businessIdFilter) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Construir filtros
      const filters: any = { businessId: businessIdFilter };
      
      if (supplierId) {
        filters.supplierId = supplierId;
      }
      
      if (status) {
        filters.status = status;
      }
      
      if (startDate && endDate) {
        filters.orderDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const purchaseOrders = await PurchaseOrder.find(filters)
        .populate('supplierId', 'name code contact.email')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await PurchaseOrder.countDocuments(filters);

      res.status(200).json({
        success: true,
        message: 'Órdenes de compra obtenidas exitosamente',
        data: {
          purchaseOrders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener orden de compra por ID
  static async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const purchaseOrder = await PurchaseOrder.findOne({ _id: id, businessId })
        .populate('supplierId', 'name code contact.email contact.phone')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('items.productId', 'name sku category');

      if (!purchaseOrder) {
        res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Orden de compra obtenida exitosamente',
        data: purchaseOrder
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar orden de compra
  static async approvePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;
      const approvedBy = req.user?.id;

      if (!businessId || !approvedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y approvedBy son requeridos'
        });
        return;
      }

      const purchaseOrder = await PurchaseOrder.findOne({ _id: id, businessId });

      if (!purchaseOrder) {
        res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
        return;
      }

      await purchaseOrder.approve(approvedBy);

      res.status(200).json({
        success: true,
        message: 'Orden de compra aprobada exitosamente',
        data: {
          purchaseOrder,
          status: purchaseOrder.status,
          approvedAt: purchaseOrder.approvedAt
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Confirmar orden de compra
  static async confirmPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const purchaseOrder = await PurchaseOrder.findOne({ _id: id, businessId });

      if (!purchaseOrder) {
        res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
        return;
      }

      await purchaseOrder.confirm();

      res.status(200).json({
        success: true,
        message: 'Orden de compra confirmada exitosamente',
        data: {
          purchaseOrder,
          status: purchaseOrder.status
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Recibir productos y actualizar inventario
  static async receiveItems(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { itemsReceived } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const purchaseOrder = await PurchaseOrder.findOne({ _id: id, businessId });

      if (!purchaseOrder) {
        res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
        return;
      }

      // Actualizar inventario usando el servicio
      const inventoryResult = await InventoryService.updateInventoryFromPurchaseOrder(
        businessId,
        id,
        itemsReceived
      );

      if (!inventoryResult.success) {
        res.status(400).json({
          success: false,
          message: 'Error actualizando inventario',
          data: {
            errors: inventoryResult.errors,
            updatedProducts: inventoryResult.updatedProducts
          }
        });
        return;
      }

      // Obtener la orden actualizada
      const updatedOrder = await PurchaseOrder.findById(id);

      res.status(200).json({
        success: true,
        message: 'Productos recibidos e inventario actualizado exitosamente',
        data: {
          purchaseOrder: updatedOrder,
          status: updatedOrder?.status,
          actualDeliveryDate: updatedOrder?.actualDeliveryDate,
          inventoryUpdate: {
            updatedProducts: inventoryResult.updatedProducts,
            errors: inventoryResult.errors
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cancelar orden de compra
  static async cancelPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const purchaseOrder = await PurchaseOrder.findOne({ _id: id, businessId });

      if (!purchaseOrder) {
        res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
        return;
      }

      await purchaseOrder.cancel(reason);

      res.status(200).json({
        success: true,
        message: 'Orden de compra cancelada exitosamente',
        data: {
          purchaseOrder,
          status: purchaseOrder.status
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener órdenes por proveedor
  static async getOrdersBySupplier(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const orders = await PurchaseOrder.getOrdersBySupplier(businessId, supplierId);

      res.status(200).json({
        success: true,
        message: 'Órdenes del proveedor obtenidas exitosamente',
        data: {
          orders,
          totalOrders: orders.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen por proveedor
  static async getSupplierSummary(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const summary = await PurchaseOrder.getSupplierSummary(businessId, supplierId);

      res.status(200).json({
        success: true,
        message: 'Resumen del proveedor obtenido exitosamente',
        data: summary[0] || {
          totalOrders: 0,
          totalAmount: 0,
          completedOrders: 0,
          pendingOrders: 0
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar orden de compra
  static async updatePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const businessId = req.user?.businessId;
      const updatedBy = req.user?.id;

      if (!businessId || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y updatedBy son requeridos'
        });
        return;
      }

      const purchaseOrder = await PurchaseOrder.findOne({ _id: id, businessId });

      if (!purchaseOrder) {
        res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
        return;
      }

      if (purchaseOrder.status === 'completed' || purchaseOrder.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'No se puede actualizar una orden completada o cancelada'
        });
        return;
      }

      // Actualizar campos permitidos
      const allowedFields = ['notes', 'internalNotes', 'delivery', 'terms'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          purchaseOrder[field] = updateData[field];
        }
      });

      purchaseOrder.updatedBy = updatedBy;
      await purchaseOrder.save();

      res.status(200).json({
        success: true,
        message: 'Orden de compra actualizada exitosamente',
        data: purchaseOrder
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}