import { Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import Product from '../models/product';

export class InventoryController {
  
  // Obtener resumen del inventario
  static async getInventorySummary(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const summary = await InventoryService.getInventorySummary(businessId);

      res.status(200).json({
        success: true,
        message: 'Resumen de inventario obtenido exitosamente',
        data: summary
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener productos con stock bajo
  static async getLowStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const lowStockProducts = await InventoryService.getLowStockProducts(businessId);

      res.status(200).json({
        success: true,
        message: 'Productos con stock bajo obtenidos exitosamente',
        data: {
          products: lowStockProducts,
          count: lowStockProducts.length
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

  // Obtener productos que necesitan reorden
  static async getReorderProducts(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const reorderProducts = await InventoryService.getReorderProducts(businessId);

      res.status(200).json({
        success: true,
        message: 'Productos que necesitan reorden obtenidos exitosamente',
        data: {
          products: reorderProducts,
          count: reorderProducts.length
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

  // Crear entrada de inventario manual
  static async createInventoryEntry(req: Request, res: Response): Promise<void> {
    try {
      const {
        productId,
        quantity,
        costPrice,
        reason,
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

      if (!productId || !quantity || !costPrice || !reason) {
        res.status(400).json({
          success: false,
          message: 'productId, quantity, costPrice y reason son requeridos'
        });
        return;
      }

      const result = await InventoryService.createInventoryEntry(
        businessId,
        productId,
        quantity,
        costPrice,
        reason,
        notes,
        createdBy
      );

      res.status(201).json({
        success: true,
        message: 'Entrada de inventario creada exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Ajustar inventario
  static async adjustInventory(req: Request, res: Response): Promise<void> {
    try {
      const {
        productId,
        adjustmentQuantity,
        reason,
        notes
      } = req.body;

      const businessId = req.user?.businessId;
      const adjustedBy = req.user?.id;

      if (!businessId || !adjustedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y adjustedBy son requeridos'
        });
        return;
      }

      if (!productId || adjustmentQuantity === undefined || !reason) {
        res.status(400).json({
          success: false,
          message: 'productId, adjustmentQuantity y reason son requeridos'
        });
        return;
      }

      const result = await InventoryService.adjustInventory(
        businessId,
        productId,
        adjustmentQuantity,
        reason,
        notes,
        adjustedBy
      );

      res.status(200).json({
        success: true,
        message: 'Inventario ajustado exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener historial de movimientos de inventario (simulado)
  static async getInventoryHistory(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Por ahora retornamos un historial simulado
      // En una implementación completa, esto vendría de una colección InventoryMovement
      const mockHistory = [
        {
          id: '1',
          productId: productId,
          movementType: 'purchase',
          quantity: 50,
          costPrice: 10000,
          previousStock: 0,
          newStock: 50,
          reason: 'Compra inicial',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          createdBy: 'Sistema'
        },
        {
          id: '2',
          productId: productId,
          movementType: 'sale',
          quantity: -5,
          costPrice: 10000,
          previousStock: 50,
          newStock: 45,
          reason: 'Venta al cliente',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdBy: 'Sistema'
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Historial de inventario obtenido exitosamente',
        data: {
          productId,
          history: mockHistory,
          count: mockHistory.length
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

  // Obtener productos por categoría con stock
  static async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const products = await Product.find({
        businessId,
        category: category
      }).select('name sku category inventory.currentStock inventory.minimumStock costPrice clientPrice');

      res.status(200).json({
        success: true,
        message: 'Productos por categoría obtenidos exitosamente',
        data: {
          category,
          products,
          count: products.length
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

  // Generar reporte de inventario
  static async generateInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Obtener resumen
      const summary = await InventoryService.getInventorySummary(businessId);
      
      // Obtener productos con stock bajo
      const lowStockProducts = await InventoryService.getLowStockProducts(businessId);
      
      // Obtener productos que necesitan reorden
      const reorderProducts = await InventoryService.getReorderProducts(businessId);

      // Obtener todos los productos
      const allProducts = await Product.find({ businessId })
        .select('name sku category inventory.currentStock inventory.minimumStock costPrice clientPrice')
        .sort({ 'inventory.currentStock': 1 });

      const report = {
        generatedAt: new Date(),
        summary,
        lowStockProducts,
        reorderProducts,
        allProducts,
        recommendations: [
          ...lowStockProducts.map(p => `Revisar stock de ${p.name} - Actual: ${p.inventory.currentStock}, Mínimo: ${p.inventory.minimumStock}`),
          ...reorderProducts.map(p => `Reordenar ${p.name} - Cantidad sugerida: ${p.inventory.reorderQuantity}`)
        ]
      };

      res.status(200).json({
        success: true,
        message: 'Reporte de inventario generado exitosamente',
        data: report
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