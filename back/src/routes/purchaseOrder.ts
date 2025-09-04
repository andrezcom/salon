import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrder';

const router = Router();

// ===== INFORMES DE STOCK MÍNIMO =====

// Obtener informe de stock mínimo
router.get('/business/:businessId/inventory/low-stock-report', PurchaseOrderController.getLowStockReport);

// ===== GESTIÓN DE ÓRDENES DE COMPRA =====

// Obtener todas las órdenes de compra
router.get('/business/:businessId/purchase-orders', PurchaseOrderController.getPurchaseOrders);

// Obtener una orden específica
router.get('/business/:businessId/purchase-orders/:orderId', PurchaseOrderController.getPurchaseOrder);

// Generar orden automática
router.post('/business/:businessId/purchase-orders/generate-automatic', PurchaseOrderController.generateAutomaticOrder);

// Crear orden manual
router.post('/business/:businessId/purchase-orders', PurchaseOrderController.createManualOrder);

// Aprobar orden
router.put('/business/:businessId/purchase-orders/:orderId/approve', PurchaseOrderController.approveOrder);

// Enviar orden
router.put('/business/:businessId/purchase-orders/:orderId/send', PurchaseOrderController.sendOrder);

// Marcar como recibida
router.put('/business/:businessId/purchase-orders/:orderId/receive', PurchaseOrderController.markAsReceived);

// Obtener resumen de órdenes
router.get('/business/:businessId/purchase-orders/summary', PurchaseOrderController.getOrderSummary);

export default router;
