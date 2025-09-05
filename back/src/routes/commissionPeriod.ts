import express from 'express';
import { CommissionPeriodController } from '../controllers/commissionPeriod';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para configuración de períodos
router.post('/config',
  requireAuth,
  requirePermission('commissions', 'create'),
  CommissionPeriodController.createConfig
);

router.get('/config/active',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getActiveConfig
);

// Rutas para gestión de períodos
router.post('/generate-yearly',
  requireAuth,
  requirePermission('commissions', 'create'),
  CommissionPeriodController.generateYearlyPeriods
);

router.get('/',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getPeriods
);

router.get('/summary',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getPeriodsSummary
);

router.get('/current',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getCurrentPeriod
);

router.get('/pending-payments',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getPendingPayments
);

router.get('/overdue',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getOverduePeriods
);

router.get('/:id',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getPeriodById
);

router.post('/:id/close',
  requireAuth,
  requirePermission('commissions', 'update'),
  CommissionPeriodController.closePeriod
);

router.post('/:id/approve',
  requireAuth,
  requirePermission('commissions', 'approve'),
  CommissionPeriodController.approvePeriod
);

router.post('/:id/pay',
  requireAuth,
  requirePermission('commissions', 'pay'),
  CommissionPeriodController.payPeriod
);

router.post('/:id/cancel',
  requireAuth,
  requirePermission('commissions', 'update'),
  CommissionPeriodController.cancelPeriod
);

router.post('/:id/recalculate',
  requireAuth,
  requirePermission('commissions', 'update'),
  CommissionPeriodController.recalculatePeriod
);

// Rutas para comisiones de expertos en períodos
router.get('/:periodId/expert/:expertId/commissions',
  requireAuth,
  requirePermission('commissions', 'read'),
  CommissionPeriodController.getExpertPeriodCommissions
);

export default router;
