import { Router } from 'express';
import { ExpenseController } from '../controllers/expense';

const router = Router();

// Obtener todos los gastos de un negocio
router.get('/business/:businessId/expenses', ExpenseController.getExpenses);

// Obtener un gasto específico
router.get('/business/:businessId/expenses/:expenseId', ExpenseController.getExpense);

// Crear gasto
router.post('/business/:businessId/expenses', ExpenseController.createExpense);

// Aprobar gasto
router.put('/business/:businessId/expenses/:expenseId/approve', ExpenseController.approveExpense);

// Rechazar gasto
router.put('/business/:businessId/expenses/:expenseId/reject', ExpenseController.rejectExpense);

// Marcar gasto como pagado
router.put('/business/:businessId/expenses/:expenseId/mark-as-paid', ExpenseController.markExpenseAsPaid);

// Cancelar gasto
router.put('/business/:businessId/expenses/:expenseId/cancel', ExpenseController.cancelExpense);

// Crear gasto recurrente
router.post('/business/:businessId/expenses/:expenseId/recurring', ExpenseController.createRecurringExpense);

// Obtener resumen de gastos
router.get('/business/:businessId/expenses/summary', ExpenseController.getExpenseSummary);

// Obtener reporte de gastos
router.get('/business/:businessId/expenses/report', ExpenseController.getExpenseReport);

// Obtener gastos próximos a vencer
router.get('/business/:businessId/expenses/upcoming', ExpenseController.getUpcomingExpenses);

export default router;
