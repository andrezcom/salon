import express from 'express';
import { PayrollAutomationController } from '../controllers/payrollAutomation';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para automatización de nómina
router.post('/generate-payrolls',
  requireAuth,
  requirePermission('payroll', 'create'),
  PayrollAutomationController.generatePayrollsForPeriod
);

router.post('/process-payments',
  requireAuth,
  requirePermission('payroll', 'pay'),
  PayrollAutomationController.processPayrollPayments
);

router.post('/generate-reminders',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollAutomationController.generateReminders
);

router.get('/eligible-employees',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollAutomationController.getEligibleEmployees
);

router.get('/validate-configuration',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollAutomationController.validatePayrollConfiguration
);

router.get('/stats',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollAutomationController.getAutomationStats
);

export default router;
