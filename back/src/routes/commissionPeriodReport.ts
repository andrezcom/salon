import express from 'express';
import { CommissionPeriodReportController } from '../controllers/commissionPeriodReport';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para reportes de períodos
router.post('/period-report',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodReportController.generatePeriodReport
);

router.post('/expert-report',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodReportController.generateExpertReport
);

router.post('/performance-report',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodReportController.generatePerformanceReport
);

// Rutas para exportación
router.post('/export/pdf',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodReportController.exportToPDF
);

router.post('/export/excel',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodReportController.exportToExcel
);

export default router;
