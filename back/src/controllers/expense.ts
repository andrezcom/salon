import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/expense';
import CashBalance from '../models/cashBalance';
import CashTransaction from '../models/cashTransaction';

export class ExpenseController {
  
  // Obtener todos los gastos de un negocio
  static async getExpenses(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        expenseType, 
        status, 
        category,
        paymentMethod,
        vendorId,
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (expenseType) filters.expenseType = expenseType;
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      if (vendorId) filters.vendorId = vendorId;
      
      if (startDate || endDate) {
        filters.requestDate = {};
        if (startDate) filters.requestDate.$gte = new Date(startDate as string);
        if (endDate) filters.requestDate.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const expenses = await Expense.find(filters)
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('rejectedBy', 'name email')
        .sort({ requestDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Expense.countDocuments(filters);

      res.json({
        success: true,
        data: expenses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener un gasto específico
  static async getExpense(req: Request, res: Response) {
    try {
      const { businessId, expenseId } = req.params;

      const expense = await Expense.findOne({ 
        businessId, 
        _id: expenseId 
      })
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      res.json({
        success: true,
        data: expense
      });

    } catch (error) {
      console.error('Error obteniendo gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear gasto
  static async createExpense(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        expenseType,
        category,
        subcategory,
        amount,
        taxAmount,
        paymentMethod,
        paymentReference,
        description,
        detailedDescription,
        location,
        department,
        vendorName,
        vendorId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        isRecurring,
        recurrencePattern,
        isInstallment,
        installmentDetails,
        budgetCategory,
        budgetAmount,
        tags,
        notes
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!expenseType || !category || !amount || !paymentMethod || !description) {
        return res.status(400).json({
          success: false,
          message: 'expenseType, category, amount, paymentMethod y description son requeridos'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }

      // Crear el gasto
      const expense = await Expense.createExpense(
        businessId,
        {
          expenseType,
          category,
          subcategory,
          amount,
          taxAmount,
          paymentMethod,
          paymentReference,
          description,
          detailedDescription,
          location,
          department,
          vendorName,
          vendorId,
          invoiceNumber,
          invoiceDate,
          dueDate,
          isRecurring,
          recurrencePattern,
          isInstallment,
          installmentDetails,
          budgetCategory,
          budgetAmount,
          tags,
          notes,
          requestedBy: userId
        }
      );

      // Obtener el gasto con datos poblados
      const populatedExpense = await Expense.findById(expense._id)
        .populate('requestedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Gasto creado exitosamente',
        data: populatedExpense
      });

    } catch (error) {
      console.error('Error creando gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar gasto
  static async approveExpense(req: Request, res: Response) {
    try {
      const { businessId, expenseId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const expense = await Expense.findOne({ 
        businessId, 
        _id: expenseId 
      });

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aprobar gastos pendientes'
        });
      }

      // Aprobar el gasto
      await expense.approve(userId, notes);

      // Obtener el gasto actualizado
      const updatedExpense = await Expense.findById(expenseId)
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: 'Gasto aprobado exitosamente',
        data: updatedExpense
      });

    } catch (error) {
      console.error('Error aprobando gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Rechazar gasto
  static async rejectExpense(req: Request, res: Response) {
    try {
      const { businessId, expenseId } = req.params;
      const { 
        rejectionReason, 
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Razón de rechazo es requerida'
        });
      }

      const expense = await Expense.findOne({ 
        businessId, 
        _id: expenseId 
      });

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden rechazar gastos pendientes'
        });
      }

      // Rechazar el gasto
      await expense.reject(userId, rejectionReason, notes);

      // Obtener el gasto actualizado
      const updatedExpense = await Expense.findById(expenseId)
        .populate('requestedBy', 'name email')
        .populate('rejectedBy', 'name email');

      res.json({
        success: true,
        message: 'Gasto rechazado exitosamente',
        data: updatedExpense
      });

    } catch (error) {
      console.error('Error rechazando gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Marcar gasto como pagado
  static async markExpenseAsPaid(req: Request, res: Response) {
    try {
      const { businessId, expenseId } = req.params;
      const { 
        paymentDate, 
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const expense = await Expense.findOne({ 
        businessId, 
        _id: expenseId 
      });

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      if (expense.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden pagar gastos aprobados'
        });
      }

      // Obtener el balance actual de caja
      const cashBalance = await CashBalance.findOne({ businessId });
      if (!cashBalance) {
        return res.status(404).json({
          success: false,
          message: 'Balance de caja no encontrado'
        });
      }

      // Si es pago en efectivo, verificar que hay suficiente
      if (expense.paymentMethod === 'cash' && cashBalance.currentBalance < expense.totalAmount) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente efectivo en caja para realizar el pago'
        });
      }

      // Marcar como pagado
      await expense.markAsPaid(paymentDate, notes);

      // Si es pago en efectivo, actualizar balance de caja
      if (expense.paymentMethod === 'cash') {
        cashBalance.currentBalance -= expense.totalAmount;
        cashBalance.lastTransactionDate = new Date();
        cashBalance.lastTransactionAmount = -expense.totalAmount;
        cashBalance.lastTransactionType = 'expense_payment';
        await cashBalance.save();

        // Crear transacción de caja
        await CashTransaction.createAdjustmentTransaction(
          businessId,
          expenseId,
          'decrease',
          expense.totalAmount,
          cashBalance.currentBalance + expense.totalAmount,
          {
            adjustmentReason: `Pago de gasto: ${expense.description}`,
            adjustmentNotes: `Gasto ID: ${expenseId}`,
            approvedBy: userId
          },
          userId
        );
      }

      // Obtener el gasto actualizado
      const updatedExpense = await Expense.findById(expenseId)
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: 'Gasto marcado como pagado exitosamente',
        data: updatedExpense
      });

    } catch (error) {
      console.error('Error marcando gasto como pagado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cancelar gasto
  static async cancelExpense(req: Request, res: Response) {
    try {
      const { businessId, expenseId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Razón de cancelación es requerida'
        });
      }

      const expense = await Expense.findOne({ 
        businessId, 
        _id: expenseId 
      });

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      if (expense.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar un gasto ya pagado'
        });
      }

      // Cancelar el gasto
      await expense.cancel(userId, reason);

      // Obtener el gasto actualizado
      const updatedExpense = await Expense.findById(expenseId)
        .populate('requestedBy', 'name email');

      res.json({
        success: true,
        message: 'Gasto cancelado exitosamente',
        data: updatedExpense
      });

    } catch (error) {
      console.error('Error cancelando gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear gasto recurrente
  static async createRecurringExpense(req: Request, res: Response) {
    try {
      const { businessId, expenseId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const expense = await Expense.findOne({ 
        businessId, 
        _id: expenseId 
      });

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      if (!expense.isRecurring) {
        return res.status(400).json({
          success: false,
          message: 'Este gasto no es recurrente'
        });
      }

      // Crear el siguiente gasto recurrente
      const nextExpense = await expense.createNextRecurringExpense();

      // Obtener el gasto recurrente creado
      const populatedExpense = await Expense.findById(nextExpense._id)
        .populate('requestedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Gasto recurrente creado exitosamente',
        data: populatedExpense
      });

    } catch (error) {
      console.error('Error creando gasto recurrente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen de gastos
  static async getExpenseSummary(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        expenseType,
        status,
        category
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (expenseType) filters.expenseType = expenseType;
      if (status) filters.status = status;
      if (category) filters.category = category;
      
      if (startDate || endDate) {
        filters.requestDate = {};
        if (startDate) filters.requestDate.$gte = new Date(startDate as string);
        if (endDate) filters.requestDate.$lte = new Date(endDate as string);
      }

      const summary = await Expense.getExpenseSummary(businessId, filters);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error obteniendo resumen de gastos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener reporte de gastos
  static async getExpenseReport(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        expenseType,
        status,
        groupBy = 'category' // category, type, status, paymentMethod, vendor
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (expenseType) filters.expenseType = expenseType;
      if (status) filters.status = status;
      
      if (startDate || endDate) {
        filters.requestDate = {};
        if (startDate) filters.requestDate.$gte = new Date(startDate as string);
        if (endDate) filters.requestDate.$lte = new Date(endDate as string);
      }

      let reportData;

      if (groupBy === 'category') {
        // Agrupar por categoría
        reportData = await Expense.aggregate([
          { $match: { businessId, ...filters } },
          {
            $group: {
              _id: '$category',
              totalAmount: { $sum: '$totalAmount' },
              totalCount: { $sum: 1 },
              byStatus: {
                $push: {
                  status: '$status',
                  amount: '$totalAmount'
                }
              },
              byType: {
                $push: {
                  type: '$expenseType',
                  amount: '$totalAmount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      } else if (groupBy === 'type') {
        // Agrupar por tipo de gasto
        reportData = await Expense.aggregate([
          { $match: { businessId, ...filters } },
          {
            $group: {
              _id: '$expenseType',
              totalAmount: { $sum: '$totalAmount' },
              totalCount: { $sum: 1 },
              byStatus: {
                $push: {
                  status: '$status',
                  amount: '$totalAmount'
                }
              },
              byCategory: {
                $push: {
                  category: '$category',
                  amount: '$totalAmount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      } else if (groupBy === 'status') {
        // Agrupar por estado
        reportData = await Expense.aggregate([
          { $match: { businessId, ...filters } },
          {
            $group: {
              _id: '$status',
              totalAmount: { $sum: '$totalAmount' },
              totalCount: { $sum: 1 },
              byType: {
                $push: {
                  type: '$expenseType',
                  amount: '$totalAmount'
                }
              },
              byCategory: {
                $push: {
                  category: '$category',
                  amount: '$totalAmount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      } else if (groupBy === 'paymentMethod') {
        // Agrupar por método de pago
        reportData = await Expense.aggregate([
          { $match: { businessId, ...filters } },
          {
            $group: {
              _id: '$paymentMethod',
              totalAmount: { $sum: '$totalAmount' },
              totalCount: { $sum: 1 },
              byStatus: {
                $push: {
                  status: '$status',
                  amount: '$totalAmount'
                }
              },
              byType: {
                $push: {
                  type: '$expenseType',
                  amount: '$totalAmount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      } else {
        // Agrupar por proveedor
        reportData = await Expense.aggregate([
          { $match: { businessId, ...filters } },
          {
            $group: {
              _id: '$vendorName',
              totalAmount: { $sum: '$totalAmount' },
              totalCount: { $sum: 1 },
              byStatus: {
                $push: {
                  status: '$status',
                  amount: '$totalAmount'
                }
              },
              byType: {
                $push: {
                  type: '$expenseType',
                  amount: '$totalAmount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      }

      // Calcular totales generales
      const totals = await Expense.aggregate([
        { $match: { businessId, ...filters } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalCount: { $sum: 1 },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0]
              }
            },
            approvedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$totalAmount', 0]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
              }
            },
            rejectedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rejected'] }, '$totalAmount', 0]
              }
            },
            cancelledAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, '$totalAmount', 0]
              }
            }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          report: reportData,
          totals: totals[0] || {
            totalAmount: 0,
            totalCount: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0,
            rejectedAmount: 0,
            cancelledAmount: 0
          },
          filters: {
            startDate,
            endDate,
            expenseType,
            status,
            groupBy
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de gastos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener gastos próximos a vencer
  static async getUpcomingExpenses(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { days = 30 } = req.query;

      const daysFromNow = new Date();
      daysFromNow.setDate(daysFromNow.getDate() + Number(days));

      const upcomingExpenses = await Expense.find({
        businessId,
        dueDate: { $lte: daysFromNow, $gte: new Date() },
        status: { $in: ['pending', 'approved'] }
      })
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ dueDate: 1 });

      res.json({
        success: true,
        data: upcomingExpenses
      });

    } catch (error) {
      console.error('Error obteniendo gastos próximos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
