import express from 'express';
import { SupplierDashboardController } from '../controllers/supplierDashboard';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para dashboard y analytics
router.get('/executive',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierDashboardController.getExecutiveDashboard
);

router.get('/analytics',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierDashboardController.getHistoricalAnalytics
);

router.post('/analytics/generate',
  authenticateToken,
  requirePermission('suppliers', 'create'),
  SupplierDashboardController.generateAnalytics
);

router.get('/supplier/:supplierId/report',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierDashboardController.getSupplierReport
);

export default router;
