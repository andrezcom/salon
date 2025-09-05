import express from 'express';
import { PayrollReportController } from '../controllers/payrollReport';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para reportes de nómina
router.post('/generate',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollReportController.generatePeriodReport
);

router.get('/',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollReportController.getReports
);

router.get('/statistics',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollReportController.getPayrollStatistics
);

router.get('/:id',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollReportController.getReportById
);

router.post('/:id/export/pdf',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollReportController.exportToPDF
);

router.post('/:id/export/excel',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollReportController.exportToExcel
);

router.delete('/:id',
  requireAuth,
  requirePermission('payroll', 'delete'),
  PayrollReportController.deleteReport
);

export default router;
