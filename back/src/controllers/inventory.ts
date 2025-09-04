import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/product';
import InventoryMovement from '../models/inventoryMovement';
import Expense from '../models/expense';

export class InventoryController {
  
  // ===== GESTIÓN DE PRODUCTOS =====
  
  // Obtener todos los productos
  static async getProducts(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        category, 
        brand, 
        isInput, 
        isRetail, 
        lowStock,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = { businessId, isActive: true };
      
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (isInput) filters['uses.isInput'] = isInput === 'true';
      if (isRetail) filters['uses.isRetail'] = isRetail === 'true';
      
      if (lowStock === 'true') {
        filters.$expr = {
          $lte: ['$inventory.currentStock', '$inventory.minimumStock']
        };
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const products = await Product.find(filters)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Product.countDocuments(filters);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener un producto específico
  static async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;

      const product = await Product.findOne({ 
        businessId, 
        _id: productId 
      })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear producto
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const productData = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      // Validar campos requeridos
      const requiredFields = ['name', 'brand', 'category', 'costPrice', 'inputPrice', 'clientPrice', 'expertPrice', 'packageInfo', 'uses', 'supplier'];
      for (const field of requiredFields) {
        if (!productData[field]) {
          res.status(400).json({
            success: false,
            message: `Campo requerido: ${field}`
          });
        }
      }

      // Crear el producto
      const product = await Product.createProduct(businessId, productData, userId);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar producto
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      const product = await Product.findOne({ businessId, _id: productId });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Actualizar el producto
      Object.assign(product, updateData);
      product.updatedBy = userId;
      await product.save();

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
      });

    } catch (error) {
      console.error('Error actualizando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar producto (soft delete)
  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const { reason, permanent = false } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Validar que el producto existe
      const existingProduct = await Product.findOne({ businessId, _id: productId });
      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Verificar si el producto tiene stock
      if (existingProduct.inventory.currentStock > 0) {
        res.status(400).json({
          success: false,
          message: 'No se puede eliminar un producto que tiene stock disponible',
          data: {
            currentStock: existingProduct.inventory.currentStock,
            suggestion: 'Primero reduzca el stock a cero o realice un ajuste de inventario'
          }
        });
        return;
      }

      // Verificar si el producto tiene movimientos recientes
      const recentMovements = await InventoryMovement.find({
        businessId,
        productId,
        movementDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 días
      }).limit(1);

      if (recentMovements.length > 0) {
        res.status(400).json({
          success: false,
          message: 'No se puede eliminar un producto con movimientos recientes',
          data: {
            suggestion: 'Use soft delete (marcar como inactivo) en lugar de eliminación permanente'
          }
        });
        return;
      }

      if (permanent) {
        // Eliminación permanente
        await Product.findByIdAndDelete(productId);
        
        res.json({
          success: true,
          message: 'Producto eliminado permanentemente',
          data: {
            deletedProduct: {
              id: productId,
              name: existingProduct.name,
              brand: existingProduct.brand
            }
          }
        });
      } else {
        // Soft delete (marcar como inactivo)
        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { 
            isActive: false,
            isDiscontinued: true,
            updatedBy: userId,
            updatedAt: new Date(),
            deletionReason: reason || 'Producto descontinuado',
            deletedAt: new Date()
          },
          { new: true }
        );

        res.json({
          success: true,
          message: 'Producto marcado como inactivo (soft delete)',
          data: {
            product: updatedProduct,
            action: 'soft_delete',
            canRestore: true
          }
        });
      }

    } catch (error) {
      console.error('Error eliminando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Restaurar producto (deshacer soft delete)
  static async restoreProduct(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Validar que el producto existe y está inactivo
      const existingProduct = await Product.findOne({ 
        businessId, 
        _id: productId, 
        isActive: false 
      });
      
      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado o ya está activo'
        });
        return;
      }

      // Restaurar producto
      const restoredProduct = await Product.findByIdAndUpdate(
        productId,
        { 
          isActive: true,
          isDiscontinued: false,
          updatedBy: userId,
          updatedAt: new Date(),
          deletionReason: undefined,
          deletedAt: undefined
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Producto restaurado exitosamente',
        data: restoredProduct
      });

    } catch (error) {
      console.error('Error restaurando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ===== GESTIÓN DE INVENTARIO =====

  // Agregar stock (compra)
  static async addStock(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const { 
        quantity, 
        unitCost, 
        reason, 
        referenceNumber,
        supplier,
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      if (!quantity || quantity <= 0) {
                  res.status(400).json({
            success: false,
            message: 'La cantidad debe ser mayor a 0'
          });
          return;
        return;
      }

      const product = await Product.findOne({ businessId, _id: productId });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Obtener stock antes del movimiento
      const stockBefore = product.inventory.currentStock;
      
      // Agregar stock
      product.addStock(quantity, reason || 'Compra');
      product.updatedBy = userId;
      await product.save();

      // Crear movimiento de inventario
      await InventoryMovement.createInMovement(businessId, productId, {
        quantity,
        unitSize: product.packageInfo.unitSize,
        unitType: product.packageInfo.unitType,
        unitCost: unitCost || product.costPrice,
        stockBefore,
        stockAfter: product.inventory.currentStock,
        reason: reason || 'Compra de productos',
        referenceNumber,
        performedBy: userId,
        description: `Compra de ${quantity} unidades`,
        notes
      });

      res.json({
        success: true,
        message: 'Stock agregado exitosamente',
        data: {
          product: product,
          movement: {
            quantity,
            stockBefore,
            stockAfter: product.inventory.currentStock
          }
        }
      });

    } catch (error) {
      console.error('Error agregando stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Reducir stock (venta/consumo)
  static async reduceStock(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const { 
        quantity, 
        reason, 
        referenceId,
        referenceType,
        referenceNumber,
        unitPrice,
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      if (!quantity || quantity <= 0) {
                  res.status(400).json({
            success: false,
            message: 'La cantidad debe ser mayor a 0'
          });
          return;
        return;
      }

      const product = await Product.findOne({ businessId, _id: productId });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Verificar si hay stock suficiente
      if (!product.hasStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente stock disponible',
          data: {
            requested: quantity,
            available: product.inventory.currentStock
          }
        });
      }

      // Obtener stock antes del movimiento
      const stockBefore = product.inventory.currentStock;
      
      // Reducir stock
      const success = product.reduceStock(quantity, reason || 'Venta');
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Error al reducir el stock'
        });
      }
      
      product.updatedBy = userId;
      await product.save();

      // Crear movimiento de inventario
      await InventoryMovement.createOutMovement(businessId, productId, {
        quantity,
        unitSize: product.packageInfo.unitSize,
        unitType: product.packageInfo.unitType,
        unitCost: product.costPrice,
        unitPrice: unitPrice || product.clientPrice,
        stockBefore,
        stockAfter: product.inventory.currentStock,
        reason: reason || 'Venta de productos',
        referenceId,
        referenceType,
        referenceNumber,
        performedBy: userId,
        description: `Venta de ${quantity} unidades`,
        notes
      });

      res.json({
        success: true,
        message: 'Stock reducido exitosamente',
        data: {
          product: product,
          movement: {
            quantity,
            stockBefore,
            stockAfter: product.inventory.currentStock
          }
        }
      });

    } catch (error) {
      console.error('Error reduciendo stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Ajustar stock (inventario físico)
  static async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const { 
        newQuantity, 
        reason, 
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad no puede ser negativa'
        });
      }

      const product = await Product.findOne({ businessId, _id: productId });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Obtener stock antes del ajuste
      const stockBefore = product.inventory.currentStock;
      const difference = newQuantity - stockBefore;
      
      // Ajustar stock
      product.inventory.currentStock = newQuantity;
      product.updatedBy = userId;
      await product.save();

      // Crear movimiento de inventario
      await InventoryMovement.createAdjustmentMovement(businessId, productId, {
        quantity: Math.abs(difference),
        unitSize: product.packageInfo.unitSize,
        unitType: product.packageInfo.unitType,
        unitCost: product.costPrice,
        stockBefore,
        stockAfter: newQuantity,
        reason: reason || 'Ajuste de inventario físico',
        performedBy: userId,
        description: `Ajuste: ${difference > 0 ? '+' : ''}${difference} unidades`,
        notes
      });

      res.json({
        success: true,
        message: 'Stock ajustado exitosamente',
        data: {
          product: product,
          adjustment: {
            difference,
            stockBefore,
            stockAfter: newQuantity
          }
        }
      });

    } catch (error) {
      console.error('Error ajustando stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Registrar pérdida de inventario
  static async recordLoss(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, productId } = req.params;
      const { 
        quantity, 
        lossType, 
        reason, 
        notes,
        location,
        department
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      if (!quantity || quantity <= 0) {
                  res.status(400).json({
            success: false,
            message: 'La cantidad debe ser mayor a 0'
          });
          return;
        return;
      }

      if (!lossType || !['loss', 'theft', 'breakage', 'spillage', 'expired', 'damaged'].includes(lossType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de pérdida inválido'
        });
      }

      const product = await Product.findOne({ businessId, _id: productId });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Verificar si hay stock suficiente
      if (!product.hasStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente stock para registrar la pérdida',
          data: {
            requested: quantity,
            available: product.inventory.currentStock
          }
        });
      }

      // Obtener stock antes de la pérdida
      const stockBefore = product.inventory.currentStock;
      
      // Registrar la pérdida
      const success = product.recordLoss(quantity, lossType, reason || 'Pérdida de inventario');
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Error al registrar la pérdida'
        });
      }
      
      product.updatedBy = userId;
      await product.save();

      // Crear movimiento de inventario
      await InventoryMovement.createLossMovement(businessId, productId, {
        quantity,
        unitSize: product.packageInfo.unitSize,
        unitType: product.packageInfo.unitType,
        unitCost: product.costPrice,
        stockBefore,
        stockAfter: product.inventory.currentStock,
        lossType,
        reason: reason || `Pérdida por ${lossType}`,
        performedBy: userId,
        description: `Pérdida: ${quantity} unidades (${lossType})`,
        location,
        department,
        notes
      });

      res.json({
        success: true,
        message: 'Pérdida registrada exitosamente',
        data: {
          product: product,
          loss: {
            quantity,
            lossType,
            stockBefore,
            stockAfter: product.inventory.currentStock,
            costImpact: quantity * product.costPrice
          }
        }
      });

    } catch (error) {
      console.error('Error registrando pérdida:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Registrar múltiples pérdidas
  static async recordMultipleLosses(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const { 
        losses, 
        reason, 
        notes,
        location,
        department
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      if (!losses || !Array.isArray(losses) || losses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de pérdidas es requerida'
        });
      }

      const results = [];
      const errors = [];

      for (const loss of losses) {
        try {
          const { productId, quantity, lossType } = loss;

          if (!productId || !quantity || !lossType) {
            errors.push({
              productId,
              error: 'productId, quantity y lossType son requeridos'
            });
            continue;
          }

          const product = await Product.findOne({ businessId, _id: productId });

          if (!product) {
            errors.push({
              productId,
              error: 'Producto no encontrado'
            });
            continue;
          }

          if (!product.hasStock(quantity)) {
            errors.push({
              productId,
              productName: product.name,
              error: 'Stock insuficiente',
              requested: quantity,
              available: product.inventory.currentStock
            });
            continue;
          }

          // Registrar la pérdida
          const stockBefore = product.inventory.currentStock;
          const success = product.recordLoss(quantity, lossType, reason || 'Pérdida múltiple');
          
          if (success) {
            product.updatedBy = userId;
            await product.save();

            // Crear movimiento de inventario
            await InventoryMovement.createLossMovement(businessId, productId, {
              quantity,
              unitSize: product.packageInfo.unitSize,
              unitType: product.packageInfo.unitType,
              unitCost: product.costPrice,
              stockBefore,
              stockAfter: product.inventory.currentStock,
              lossType,
              reason: reason || `Pérdida múltiple por ${lossType}`,
              performedBy: userId,
              description: `Pérdida múltiple: ${quantity} unidades (${lossType})`,
              location,
              department,
              notes
            });

            results.push({
              productId,
              productName: product.name,
              quantity,
              lossType,
              stockBefore,
              stockAfter: product.inventory.currentStock,
              costImpact: quantity * product.costPrice
            });
          }
        } catch (error) {
          errors.push({
            productId: loss.productId,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      res.json({
        success: true,
        message: `Pérdidas procesadas: ${results.length} exitosas, ${errors.length} con errores`,
        data: {
          successful: results,
          errors,
          summary: {
            totalProcessed: losses.length,
            successful: results.length,
            failed: errors.length,
            totalCostImpact: results.reduce((sum, result) => sum + result.costImpact, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error registrando pérdidas múltiples:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ===== MOVIMIENTOS DE INVENTARIO =====

  // Obtener movimientos de un producto
  static async getProductMovements(req: Request, res: Response) {
    try {
      const { businessId, productId } = req.params;
      const { 
        movementType, 
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (movementType) filters.movementType = movementType;
      if (startDate || endDate) {
        filters.movementDate = {};
        if (startDate) filters.movementDate.$gte = new Date(startDate as string);
        if (endDate) filters.movementDate.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const movements = await InventoryMovement.find({ businessId, productId, ...filters })
        .populate('performedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ movementDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await InventoryMovement.countDocuments({ businessId, productId, ...filters });

      res.json({
        success: true,
        data: movements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo movimientos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ===== REPORTES Y RESUMENES =====

  // Obtener resumen de inventario
  static async getInventorySummary(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      const summary = await Product.getInventorySummary(businessId);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error obteniendo resumen de inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener productos con stock bajo
  static async getLowStockProducts(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      const lowStockProducts = await Product.getLowStockProducts(businessId);

      res.json({
        success: true,
        data: lowStockProducts
      });

    } catch (error) {
      console.error('Error obteniendo productos con stock bajo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener reporte de movimientos
  static async getMovementReport(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        movementType,
        groupBy = 'type' // type, category, product
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (movementType) filters.movementType = movementType;
      if (startDate || endDate) {
        filters.movementDate = {};
        if (startDate) filters.movementDate.$gte = new Date(startDate as string);
        if (endDate) filters.movementDate.$lte = new Date(endDate as string);
      }

      let reportData;

      if (groupBy === 'type') {
        reportData = await InventoryMovement.getMovementSummary(businessId, filters);
      } else if (groupBy === 'product') {
        reportData = await InventoryMovement.aggregate([
          { $match: { businessId, ...filters } },
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $group: {
              _id: '$product.name',
              totalMovements: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
              totalCost: { $sum: '$totalCost' },
              totalPrice: { $sum: { $ifNull: ['$totalPrice', 0] } }
            }
          },
          { $sort: { totalQuantity: -1 } }
        ]);
      } else {
        reportData = await InventoryMovement.aggregate([
          { $match: { businessId, ...filters } },
          {
            $group: {
              _id: '$movementCategory',
              totalMovements: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
              totalCost: { $sum: '$totalCost' },
              totalPrice: { $sum: { $ifNull: ['$totalPrice', 0] } }
            }
          },
          { $sort: { totalQuantity: -1 } }
        ]);
      }

      res.json({
        success: true,
        data: {
          report: reportData,
          filters: {
            startDate,
            endDate,
            movementType,
            groupBy
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de movimientos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ===== INTEGRACIÓN CON GASTOS =====

  // Crear gasto de compra de productos
  static async createPurchaseExpense(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        productId,
        quantity,
        unitCost,
        supplier,
        invoiceNumber,
        notes
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
                  res.status(400).json({
            success: false,
            message: 'ID de usuario requerido'
          });
          return;
        return;
      }

      const product = await Product.findOne({ businessId, _id: productId });

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      const totalCost = quantity * unitCost;

      // Crear gasto
      const expense = await Expense.createExpense(businessId, {
        expenseType: 'operational',
        category: 'insumos',
        subcategory: 'productos',
        amount: totalCost,
        paymentMethod: 'cash', // Por defecto en efectivo
        description: `Compra de ${product.name} - ${quantity} unidades`,
        detailedDescription: `Producto: ${product.name}\nCantidad: ${quantity}\nCosto unitario: $${unitCost}\nTotal: $${totalCost}`,
        vendorName: supplier || product.supplier.name,
        invoiceNumber,
        notes,
        requestedBy: userId
      });

      // Agregar stock al producto
      const stockBefore = product.inventory.currentStock;
      product.addStock(quantity, 'Compra');
      product.updatedBy = userId;
      await product.save();

      // Crear movimiento de inventario
      await InventoryMovement.createInMovement(businessId, productId, {
        quantity,
        unitSize: product.packageInfo.unitSize,
        unitType: product.packageInfo.unitType,
        unitCost,
        stockBefore,
        stockAfter: product.inventory.currentStock,
        reason: 'Compra de productos',
        referenceId: expense._id.toString(),
        referenceType: 'expense',
        referenceNumber: invoiceNumber,
        performedBy: userId,
        description: `Compra de ${quantity} unidades`,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Gasto de compra creado y stock agregado exitosamente',
        data: {
          expense,
          product: product,
          movement: {
            quantity,
            stockBefore,
            stockAfter: product.inventory.currentStock
          }
        }
      });

    } catch (error) {
      console.error('Error creando gasto de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
