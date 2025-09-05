import express from 'express';
import { PayrollController } from '../controllers/payroll';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para gestión de nómina
router.get('/',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollController.getPayrolls
);

router.get('/summary',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollController.getPayrollSummary
);

router.get('/eligible-employees',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollController.getEligibleEmployees
);

router.get('/:id',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollController.getPayrollById
);

router.post('/',
  requireAuth,
  requirePermission('payroll', 'create'),
  PayrollController.createPayroll
);

router.put('/:id',
  requireAuth,
  requirePermission('payroll', 'update'),
  PayrollController.updatePayroll
);

router.post('/:id/approve',
  requireAuth,
  requirePermission('payroll', 'approve'),
  PayrollController.approvePayroll
);

router.post('/:id/pay',
  requireAuth,
  requirePermission('payroll', 'pay'),
  PayrollController.payPayroll
);

router.post('/:id/cancel',
  requireAuth,
  requirePermission('payroll', 'update'),
  PayrollController.cancelPayroll
);

router.post('/:id/recalculate',
  requireAuth,
  requirePermission('payroll', 'update'),
  PayrollController.recalculatePayroll
);

// Rutas para integración con anticipos
router.post('/:id/apply-advance-deductions',
  requireAuth,
  requirePermission('payroll', 'update'),
  PayrollController.applyAdvanceDeductions
);

router.get('/employees/:employeeId/pending-advances',
  requireAuth,
  requirePermission('payroll', 'read'),
  PayrollController.getPendingAdvances
);

export default router;
