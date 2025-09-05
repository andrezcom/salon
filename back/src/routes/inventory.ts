import express from 'express';
import { InventoryController } from '../controllers/inventory';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para gestión de inventario
router.get('/summary',
  authenticateToken,
  requirePermission('inventory', 'read'),
  InventoryController.getInventorySummary
);

router.get('/low-stock',
  authenticateToken,
  requirePermission('inventory', 'read'),
  InventoryController.getLowStockProducts
);

router.get('/reorder',
  authenticateToken,
  requirePermission('inventory', 'read'),
  InventoryController.getReorderProducts
);

router.get('/category/:category',
  authenticateToken,
  requirePermission('inventory', 'read'),
  InventoryController.getProductsByCategory
);

router.get('/history/:productId',
  authenticateToken,
  requirePermission('inventory', 'read'),
  InventoryController.getInventoryHistory
);

router.get('/report',
  authenticateToken,
  requirePermission('inventory', 'read'),
  InventoryController.generateInventoryReport
);

router.post('/entry',
  authenticateToken,
  requirePermission('inventory', 'create'),
  InventoryController.createInventoryEntry
);

router.post('/adjust',
  authenticateToken,
  requirePermission('inventory', 'update'),
  InventoryController.adjustInventory
);

export default router;