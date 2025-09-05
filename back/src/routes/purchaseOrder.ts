import express from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrder';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para gestión de órdenes de compra
router.get('/',
  authenticateToken,
  requirePermission('purchaseOrders', 'read'),
  PurchaseOrderController.getPurchaseOrders
);

router.get('/supplier/:supplierId',
  authenticateToken,
  requirePermission('purchaseOrders', 'read'),
  PurchaseOrderController.getOrdersBySupplier
);

router.get('/supplier/:supplierId/summary',
  authenticateToken,
  requirePermission('purchaseOrders', 'read'),
  PurchaseOrderController.getSupplierSummary
);

router.get('/:id',
  authenticateToken,
  requirePermission('purchaseOrders', 'read'),
  PurchaseOrderController.getPurchaseOrderById
);

router.post('/',
  authenticateToken,
  requirePermission('purchaseOrders', 'create'),
  PurchaseOrderController.createPurchaseOrder
);

router.put('/:id',
  authenticateToken,
  requirePermission('purchaseOrders', 'update'),
  PurchaseOrderController.updatePurchaseOrder
);

router.post('/:id/approve',
  authenticateToken,
  requirePermission('purchaseOrders', 'approve'),
  PurchaseOrderController.approvePurchaseOrder
);

router.post('/:id/confirm',
  authenticateToken,
  requirePermission('purchaseOrders', 'update'),
  PurchaseOrderController.confirmPurchaseOrder
);

router.post('/:id/receive',
  authenticateToken,
  requirePermission('purchaseOrders', 'update'),
  PurchaseOrderController.receiveItems
);

router.put('/:id/cancel',
  authenticateToken,
  requirePermission('purchaseOrders', 'update'),
  PurchaseOrderController.cancelPurchaseOrder
);

export default router;