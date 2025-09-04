import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PurchaseOrder from '../models/purchaseOrder';
import Product from '../models/product';
import InventoryMovement from '../models/inventoryMovement';

export class PurchaseOrderController {
  
  // ===== INFORMES DE STOCK MÍNIMO =====
  
  // Obtener informe de stock mínimo
  static async getLowStockReport(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        includeOutOfStock = 'true',
        includeLowStock = 'true',
        category,
        supplier,
        urgency = 'all' // all, critical, warning
      } = req.query;

      // Construir filtros
      const filters: any = { businessId, isActive: true };
      
      if (category) filters.category = category;
      if (supplier) filters['supplier.name'] = supplier;

      // Obtener productos
      const products = await Product.find(filters);
      
      // Filtrar productos que necesitan reorden
      const productsToReorder = products.filter(product => {
        const isOutOfStock = product.inventory.currentStock === 0;
        const isLowStock = product.inventory.currentStock <= product.inventory.minimumStock;
        
        if (urgency === 'critical' && !isOutOfStock) return false;
        if (urgency === 'warning' && isOutOfStock) return false;
        
        if (includeOutOfStock === 'true' && isOutOfStock) return true;
        if (includeLowStock === 'true' && isLowStock) return true;
        
        return false;
      });

      // Calcular información de reorden
      const reorderInfo = productsToReorder.map(product => {
        let suggestedQuantity = product.inventory.reorderQuantity;
        let urgencyLevel = 'normal';
        let reason = 'reorder';
        
        if (product.inventory.currentStock === 0) {
          urgencyLevel = 'critical';
          reason = 'out_of_stock';
          suggestedQuantity = Math.max(suggestedQuantity, product.inventory.minimumStock * 2);
        } else if (product.inventory.currentStock <= product.inventory.minimumStock) {
          urgencyLevel = 'warning';
          reason = 'low_stock';
        }
        
        const daysUntilOut = product.inventory.currentStock > 0 ? 
          Math.ceil(product.inventory.currentStock / (product.inventory.minimumStock / 7)) : 0;
        
        return {
          productId: product._id,
          productName: product.name,
          brand: product.brand,
          sku: product.sku,
          category: product.category,
          currentStock: product.inventory.currentStock,
          minimumStock: product.inventory.minimumStock,
          reorderQuantity: product.inventory.reorderQuantity,
          suggestedQuantity,
          unitCost: product.costPrice,
          totalCost: suggestedQuantity * product.costPrice,
          supplier: product.supplier,
          urgencyLevel,
          reason,
          daysUntilOut,
          lastMovement: null // Se llenará después
        };
      });

      // Obtener último movimiento de cada producto
      for (const item of reorderInfo) {
        const lastMovement = await InventoryMovement.findOne({
          businessId,
          productId: item.productId,
          movementType: 'in'
        }).sort({ movementDate: -1 });
        
        item.lastMovement = lastMovement ? {
          date: lastMovement.movementDate,
          quantity: lastMovement.quantity,
          reason: lastMovement.reason
        } : null;
      }

      // Agrupar por proveedor
      const supplierGroups = reorderInfo.reduce((groups, item) => {
        const supplierName = item.supplier.name;
        if (!groups[supplierName]) {
          groups[supplierName] = {
            supplier: item.supplier,
            items: [],
            totalCost: 0,
            totalItems: 0
          };
        }
        groups[supplierName].items.push(item);
        groups[supplierName].totalCost += item.totalCost;
        groups[supplierName].totalItems += item.suggestedQuantity;
        return groups;
      }, {});

      // Calcular totales
      const totals = {
        totalProducts: reorderInfo.length,
        totalCost: reorderInfo.reduce((sum, item) => sum + item.totalCost, 0),
        totalItems: reorderInfo.reduce((sum, item) => sum + item.suggestedQuantity, 0),
        criticalProducts: reorderInfo.filter(item => item.urgencyLevel === 'critical').length,
        warningProducts: reorderInfo.filter(item => item.urgencyLevel === 'warning').length,
        suppliers: Object.keys(supplierGroups).length
      };

      res.json({
        success: true,
        data: {
          report: {
            items: reorderInfo,
            supplierGroups,
            totals
          },
          filters: {
            includeOutOfStock,
            includeLowStock,
            category,
            supplier,
            urgency
          },
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error generando informe de stock mínimo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ===== GESTIÓN DE ÓRDENES DE COMPRA =====

  // Obtener todas las órdenes de compra
  static async getPurchaseOrders(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        status, 
        orderType,
        supplier,
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (status) filters.status = status;
      if (orderType) filters.orderType = orderType;
      if (supplier) filters['supplier.name'] = supplier;
      
      if (startDate || endDate) {
        filters.orderDate = {};
        if (startDate) filters.orderDate.$gte = new Date(startDate as string);
        if (endDate) filters.orderDate.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const orders = await PurchaseOrder.find(filters)
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('sentBy', 'name email')
        .populate('receivedBy', 'name email')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await PurchaseOrder.countDocuments(filters);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo órdenes de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener una orden específica
  static async getPurchaseOrder(req: Request, res: Response) {
    try {
      const { businessId, orderId } = req.params;

      const order = await PurchaseOrder.findOne({ 
        businessId, 
        _id: orderId 
      })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('sentBy', 'name email')
      .populate('receivedBy', 'name email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Error obteniendo orden de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Generar orden automática
  static async generateAutomaticOrder(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        includeLowStock = true,
        includeOutOfStock = true,
        supplierFilter,
        categoryFilter
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      // Generar órdenes automáticas
      const orders = await PurchaseOrder.generateAutomaticOrder(
        businessId,
        userId,
        {
          includeLowStock,
          includeOutOfStock,
          supplierFilter,
          categoryFilter
        }
      );

      if (!orders || orders.length === 0) {
        return res.json({
          success: true,
          message: 'No hay productos que necesiten reorden',
          data: {
            orders: [],
            message: 'Todos los productos tienen stock suficiente'
          }
        });
      }

      res.status(201).json({
        success: true,
        message: `Se generaron ${orders.length} órdenes de compra automáticas`,
        data: {
          orders,
          summary: {
            totalOrders: orders.length,
            totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
            totalItems: orders.reduce((sum, order) => sum + order.items.length, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error generando orden automática:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear orden manual
  static async createManualOrder(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        supplier,
        items,
        notes,
        expectedDeliveryDate
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!supplier || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Proveedor e items son requeridos'
        });
      }

      // Generar número de orden
      const orderNumber = `PO-MAN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Validar y preparar items
      const orderItems = [];
      for (const item of items) {
        const product = await Product.findOne({ businessId, _id: item.productId });
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Producto no encontrado: ${item.productId}`
          });
        }

        orderItems.push({
          productId: product._id.toString(),
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          unitCost: item.unitCost || product.costPrice,
          totalCost: item.quantity * (item.unitCost || product.costPrice),
          currentStock: product.inventory.currentStock,
          minimumStock: product.inventory.minimumStock,
          reorderQuantity: product.inventory.reorderQuantity,
          reason: 'manual'
        });
      }

      // Crear la orden
      const order = new PurchaseOrder({
        businessId,
        orderNumber,
        orderType: 'manual',
        status: 'draft',
        supplier,
        items: orderItems,
        subtotal: orderItems.reduce((sum, item) => sum + item.totalCost, 0),
        taxAmount: 0,
        totalAmount: orderItems.reduce((sum, item) => sum + item.totalCost, 0),
        orderDate: new Date(),
        expectedDeliveryDate,
        createdBy: userId,
        notes
      });

      await order.save();

      res.status(201).json({
        success: true,
        message: 'Orden de compra creada exitosamente',
        data: order
      });

    } catch (error) {
      console.error('Error creando orden manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar orden
  static async approveOrder(req: Request, res: Response) {
    try {
      const { businessId, orderId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const order = await PurchaseOrder.findOne({ businessId, _id: orderId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }

      await order.approve(userId, notes);

      res.json({
        success: true,
        message: 'Orden aprobada exitosamente',
        data: order
      });

    } catch (error) {
      console.error('Error aprobando orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Enviar orden
  static async sendOrder(req: Request, res: Response) {
    try {
      const { businessId, orderId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const order = await PurchaseOrder.findOne({ businessId, _id: orderId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }

      await order.send(userId, notes);

      res.json({
        success: true,
        message: 'Orden enviada exitosamente',
        data: order
      });

    } catch (error) {
      console.error('Error enviando orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Marcar como recibida
  static async markAsReceived(req: Request, res: Response) {
    try {
      const { businessId, orderId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const order = await PurchaseOrder.findOne({ businessId, _id: orderId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }

      await order.markAsReceived(userId, notes);

      // Agregar stock a los productos
      for (const item of order.items) {
        const product = await Product.findOne({ businessId, _id: item.productId });
        if (product) {
          const stockBefore = product.inventory.currentStock;
          product.addStock(item.quantity, 'Recepción de orden de compra');
          await product.save();

          // Crear movimiento de inventario
          await InventoryMovement.createInMovement(businessId, item.productId, {
            quantity: item.quantity,
            unitSize: product.packageInfo.unitSize,
            unitType: product.packageInfo.unitType,
            unitCost: item.unitCost,
            stockBefore,
            stockAfter: product.inventory.currentStock,
            reason: 'Recepción de orden de compra',
            referenceId: order._id.toString(),
            referenceType: 'purchase',
            referenceNumber: order.orderNumber,
            performedBy: userId,
            description: `Recepción de ${item.quantity} unidades`,
            notes: `Orden: ${order.orderNumber}`
          });
        }
      }

      res.json({
        success: true,
        message: 'Orden marcada como recibida y stock actualizado',
        data: order
      });

    } catch (error) {
      console.error('Error marcando orden como recibida:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen de órdenes
  static async getOrderSummary(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        status,
        orderType
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (status) filters.status = status;
      if (orderType) filters.orderType = orderType;
      
      if (startDate || endDate) {
        filters.orderDate = {};
        if (startDate) filters.orderDate.$gte = new Date(startDate as string);
        if (endDate) filters.orderDate.$lte = new Date(endDate as string);
      }

      const summary = await PurchaseOrder.getOrderSummary(businessId, filters);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error obteniendo resumen de órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
