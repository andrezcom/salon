import { Router } from 'express';
import { InventoryController } from '../controllers/inventory';

const router = Router();

// ===== GESTIÓN DE PRODUCTOS =====

// Obtener todos los productos
router.get('/business/:businessId/products', InventoryController.getProducts);

// Obtener un producto específico
router.get('/business/:businessId/products/:productId', InventoryController.getProduct);

// Crear producto
router.post('/business/:businessId/products', InventoryController.createProduct);

// Actualizar producto
router.put('/business/:businessId/products/:productId', InventoryController.updateProduct);

// Eliminar producto (soft delete por defecto)
router.delete('/business/:businessId/products/:productId', InventoryController.deleteProduct);

// Restaurar producto (deshacer soft delete)
router.patch('/business/:businessId/products/:productId/restore', InventoryController.restoreProduct);

// ===== GESTIÓN DE INVENTARIO =====

// Agregar stock (compra)
router.post('/business/:businessId/products/:productId/add-stock', InventoryController.addStock);

// Reducir stock (venta/consumo)
router.post('/business/:businessId/products/:productId/reduce-stock', InventoryController.reduceStock);

// Ajustar stock (inventario físico)
router.post('/business/:businessId/products/:productId/adjust-stock', InventoryController.adjustStock);

// Registrar pérdida de inventario
router.post('/business/:businessId/products/:productId/record-loss', InventoryController.recordLoss);

// Registrar múltiples pérdidas
router.post('/business/:businessId/inventory/record-multiple-losses', InventoryController.recordMultipleLosses);

// ===== MOVIMIENTOS DE INVENTARIO =====

// Obtener movimientos de un producto
router.get('/business/:businessId/products/:productId/movements', InventoryController.getProductMovements);

// ===== REPORTES Y RESUMENES =====

// Obtener resumen de inventario
router.get('/business/:businessId/inventory/summary', InventoryController.getInventorySummary);

// Obtener productos con stock bajo
router.get('/business/:businessId/inventory/low-stock', InventoryController.getLowStockProducts);

// Obtener reporte de movimientos
router.get('/business/:businessId/inventory/movements/report', InventoryController.getMovementReport);

// ===== INTEGRACIÓN CON GASTOS =====

// Crear gasto de compra de productos
router.post('/business/:businessId/products/:productId/purchase-expense', InventoryController.createPurchaseExpense);

export default router;
