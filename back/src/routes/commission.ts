import { Router } from 'express';
import { CommissionController } from '../controllers/commission';

const router = Router();

// Obtener todas las comisiones de un negocio
router.get('/business/:businessId/commissions', CommissionController.getCommissions);

// Obtener comisiones de un experto específico
router.get('/business/:businessId/experts/:expertId/commissions', CommissionController.getExpertCommissions);

// Obtener una comisión específica
router.get('/business/:businessId/commissions/:commissionId', CommissionController.getCommission);

// Aplicar evento excepcional a una comisión
router.put('/business/:businessId/commissions/:commissionId/exceptional', CommissionController.applyExceptionalEvent);

// Aprobar una comisión
router.put('/business/:businessId/commissions/:commissionId/approve', CommissionController.approveCommission);

// Marcar comisión como pagada
router.put('/business/:businessId/commissions/:commissionId/pay', CommissionController.markAsPaid);

// Cancelar una comisión
router.put('/business/:businessId/commissions/:commissionId/cancel', CommissionController.cancelCommission);

// Recalcular comisiones de una venta
router.put('/business/:businessId/sales/:saleId/recalculate-commissions', CommissionController.recalculateSaleCommissions);

// Obtener reporte de comisiones
router.get('/business/:businessId/commissions/report', CommissionController.getCommissionReport);

export default router;
