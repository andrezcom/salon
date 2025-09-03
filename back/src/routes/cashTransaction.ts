import { Router } from 'express';
import { CashTransactionController } from '../controllers/cashTransaction';

const router = Router();

// Obtener todas las transacciones de caja de un negocio
router.get('/business/:businessId/cash-transactions', CashTransactionController.getCashTransactions);

// Obtener una transacción específica
router.get('/business/:businessId/cash-transactions/:transactionId', CashTransactionController.getCashTransaction);

// Crear transacción de propina
router.post('/business/:businessId/sales/:saleId/tip', CashTransactionController.createTipTransaction);

// Crear transacción de cambio/devolución
router.post('/business/:businessId/sales/:saleId/change', CashTransactionController.createChangeTransaction);

// Crear transacción de reembolso
router.post('/business/:businessId/sales/:saleId/refund', CashTransactionController.createRefundTransaction);

// Crear transacción de ajuste de caja
router.post('/business/:businessId/cash-adjustment', CashTransactionController.createAdjustmentTransaction);

// Aprobar una transacción
router.put('/business/:businessId/cash-transactions/:transactionId/approve', CashTransactionController.approveTransaction);

// Cancelar una transacción
router.put('/business/:businessId/cash-transactions/:transactionId/cancel', CashTransactionController.cancelTransaction);

// Revertir una transacción
router.put('/business/:businessId/cash-transactions/:transactionId/reverse', CashTransactionController.reverseTransaction);

// Obtener reporte de transacciones de caja
router.get('/business/:businessId/cash-transactions/report', CashTransactionController.getCashTransactionReport);

export default router;
