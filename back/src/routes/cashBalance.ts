import express from 'express';
import {
  openDailyBalance,
  closeDailyBalance,
  getCurrentBalance,
  getBalanceHistory,
  recordReceivablePayment,
  getBalanceSummary
} from '../controllers/cashBalance';

const router = express.Router();

// Ruta de prueba
router.get('/test', (_req, res) => {
  res.json({ message: 'Ruta de balance de caja funcionando correctamente' });
});

// Obtener balance actual del día
router.get('/:businessId/current', getCurrentBalance);

// Obtener resumen del balance
router.get('/:businessId/summary', getBalanceSummary);

// Obtener historial de balances
router.get('/:businessId/history', getBalanceHistory);

// Abrir balance del día
router.post('/:businessId/open', openDailyBalance);

// Cerrar balance del día
router.post('/:businessId/close', closeDailyBalance);

// Registrar pago a cuenta por cobrar
router.post('/:businessId/receivable-payment', recordReceivablePayment);

// Listar todas las rutas disponibles
router.get('/', (_req, res) => {
  res.json({ 
    message: 'API de Balance de Caja funcionando correctamente', 
    endpoints: [
      'GET /test - Ruta de prueba',
      'GET /:businessId/current - Obtener balance actual del día',
      'GET /:businessId/summary - Obtener resumen del balance',
      'GET /:businessId/history - Obtener historial de balances',
      'POST /:businessId/open - Abrir balance del día',
      'POST /:businessId/close - Cerrar balance del día',
      'POST /:businessId/receivable-payment - Registrar pago a cuenta por cobrar'
    ]
  });
});

export default router;
