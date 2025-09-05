import { Router } from 'express';
import { SaleController } from '../controllers/saleUpdated';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = Router();

// ===== RUTAS DE VENTAS =====

// Obtener todas las ventas
router.get('/sales', 
  requireAuth,
  requirePermission('sales', 'read'),
  SaleController.getAllSales
);

// Obtener venta por ID
router.get('/sales/:saleId', 
  requireAuth,
  requirePermission('sales', 'read'),
  SaleController.getSaleById
);

// Crear nueva venta
router.post('/sales', 
  requireAuth,
  requirePermission('sales', 'create'),
  SaleController.createSale
);

// Actualizar venta
router.put('/sales/:saleId', 
  requireAuth,
  requirePermission('sales', 'update'),
  SaleController.updateSale
);

// Eliminar venta
router.delete('/sales/:saleId', 
  requireAuth,
  requirePermission('sales', 'delete'),
  SaleController.deleteSale
);

// Obtener ventas por experto
router.get('/experts/:expertId/sales', 
  requireAuth,
  requirePermission('sales', 'read'),
  SaleController.getSalesByExpert
);

// Recalcular comisiones de una venta
router.post('/sales/:saleId/recalculate-commissions', 
  requireAuth,
  requirePermission('sales', 'update'),
  SaleController.recalculateCommissions
);

// ===== RUTAS PARA MANEJO DE DESCUENTOS =====

// Aplicar descuento a una venta
router.post('/sales/:saleId/discounts', 
  requireAuth,
  requirePermission('sales', 'update'),
  SaleController.applyDiscount
);

// Remover descuento de una venta
router.delete('/sales/:saleId/discounts/:discountIndex', 
  requireAuth,
  requirePermission('sales', 'update'),
  SaleController.removeDiscount
);

// Obtener resumen de descuentos de una venta
router.get('/sales/:saleId/discounts/summary', 
  requireAuth,
  requirePermission('sales', 'read'),
  SaleController.getDiscountSummary
);

// Recalcular totales de una venta
router.post('/sales/:saleId/recalculate-totals', 
  requireAuth,
  requirePermission('sales', 'update'),
  SaleController.recalculateTotals
);

export default router;
