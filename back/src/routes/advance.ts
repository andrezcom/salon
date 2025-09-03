import { Router } from 'express';
import { AdvanceController } from '../controllers/advance';

const router = Router();

// Obtener todos los anticipos de un negocio
router.get('/business/:businessId/advances', AdvanceController.getAdvances);

// Obtener un anticipo específico
router.get('/business/:businessId/advances/:advanceId', AdvanceController.getAdvance);

// Crear solicitud de anticipo
router.post('/business/:businessId/advances', AdvanceController.createAdvance);

// Aprobar anticipo
router.put('/business/:businessId/advances/:advanceId/approve', AdvanceController.approveAdvance);

// Rechazar anticipo
router.put('/business/:businessId/advances/:advanceId/reject', AdvanceController.rejectAdvance);

// Marcar anticipo como pagado
router.put('/business/:businessId/advances/:advanceId/mark-as-paid', AdvanceController.markAdvanceAsPaid);

// Cancelar anticipo
router.put('/business/:businessId/advances/:advanceId/cancel', AdvanceController.cancelAdvance);

// Aplicar descuento de comisión
router.put('/business/:businessId/advances/:advanceId/apply-deduction', AdvanceController.applyCommissionDeduction);

// Marcar anticipo como reembolsado
router.put('/business/:businessId/advances/:advanceId/mark-as-repaid', AdvanceController.markAdvanceAsRepaid);

// Obtener resumen de anticipos por experto
router.get('/business/:businessId/experts/:expertId/advance-summary', AdvanceController.getExpertAdvanceSummary);

// Obtener reporte de anticipos
router.get('/business/:businessId/advances/report', AdvanceController.getAdvanceReport);

export default router;
