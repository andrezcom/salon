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

// Aplicar descuento de nómina
router.put('/business/:businessId/advances/:advanceId/apply-payroll-deduction', AdvanceController.applyPayrollDeduction);

// Aplicar descuento de comisión
router.put('/business/:businessId/advances/:advanceId/apply-commission-deduction', AdvanceController.applyCommissionDeduction);

// Marcar anticipo como reembolsado
router.put('/business/:businessId/advances/:advanceId/mark-as-repaid', AdvanceController.markAdvanceAsRepaid);

// Obtener anticipos pendientes de descuento para nómina
router.get('/business/:businessId/employees/:employeeId/pending-payroll-deductions', AdvanceController.getPendingPayrollDeductions);

// Obtener anticipos pendientes de descuento para comisiones
router.get('/business/:businessId/employees/:employeeId/pending-commission-deductions', AdvanceController.getPendingCommissionDeductions);

// Obtener resumen de anticipos por empleado
router.get('/business/:businessId/employees/:employeeId/advance-summary', AdvanceController.getEmployeeAdvanceSummary);

// Obtener reporte de anticipos
router.get('/business/:businessId/advances/report', AdvanceController.getAdvanceReport);

export default router;
