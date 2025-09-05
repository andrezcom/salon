import express from 'express';
import { AccountsPayableController } from '../controllers/accountsPayable';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para gestión de cuentas por pagar
router.get('/',
  authenticateToken,
  requirePermission('accountsPayable', 'read'),
  AccountsPayableController.getAccountsPayable
);

router.get('/overdue',
  authenticateToken,
  requirePermission('accountsPayable', 'read'),
  AccountsPayableController.getOverdueInvoices
);

router.get('/summary',
  authenticateToken,
  requirePermission('accountsPayable', 'read'),
  AccountsPayableController.getGeneralSummary
);

router.get('/supplier/:supplierId/summary',
  authenticateToken,
  requirePermission('accountsPayable', 'read'),
  AccountsPayableController.getSupplierSummary
);

router.get('/:id',
  authenticateToken,
  requirePermission('accountsPayable', 'read'),
  AccountsPayableController.getAccountPayableById
);

router.post('/',
  authenticateToken,
  requirePermission('accountsPayable', 'create'),
  AccountsPayableController.createAccountPayable
);

router.put('/:id',
  authenticateToken,
  requirePermission('accountsPayable', 'update'),
  AccountsPayableController.updateAccountPayable
);

router.post('/:id/pay',
  authenticateToken,
  requirePermission('accountsPayable', 'pay'),
  AccountsPayableController.processPayment
);

router.put('/:id/cancel',
  authenticateToken,
  requirePermission('accountsPayable', 'update'),
  AccountsPayableController.cancelAccountPayable
);

export default router;
