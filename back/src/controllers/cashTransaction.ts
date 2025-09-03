import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CashTransaction from '../models/cashTransaction';
import Sale from '../models/sale';
import CashBalance from '../models/cashBalance';

export class CashTransactionController {
  
  // Obtener todas las transacciones de caja de un negocio
  static async getCashTransactions(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        transactionType, 
        status, 
        paymentMethod,
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (transactionType) filters.transactionType = transactionType;
      if (status) filters.status = status;
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate as string);
        if (endDate) filters.createdAt.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const transactions = await CashTransaction.find(filters)
        .populate('saleId', 'idSale nameClient date total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await CashTransaction.countDocuments(filters);

      res.json({
        success: true,
        data: transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo transacciones de caja:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener una transacción específica
  static async getCashTransaction(req: Request, res: Response) {
    try {
      const { businessId, transactionId } = req.params;

      const transaction = await CashTransaction.findOne({ 
        businessId, 
        _id: transactionId 
      })
      .populate('saleId', 'idSale nameClient date total services retail');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Error obteniendo transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear transacción de propina
  static async createTipTransaction(req: Request, res: Response) {
    try {
      const { businessId, saleId } = req.params;
      const { 
        tipAmount, 
        tipPaymentMethod, 
        tipPercentage,
        tipReason, 
        tipRecipient,
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!tipAmount || tipAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monto de propina debe ser mayor a 0'
        });
      }

      // Verificar que la venta existe
      const sale = await Sale.findOne({ businessId, _id: saleId });
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
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

      // Determinar el método de pago original de la venta
      const originalPaymentMethod = sale.paymentMethod[0]?.payment || 'cash';

      // Crear la transacción de propina
      const transaction = await CashTransaction.createTipTransaction(
        businessId,
        saleId,
        tipAmount,
        tipPaymentMethod,
        originalPaymentMethod as 'cash' | 'card' | 'transfer',
        cashBalance.currentBalance,
        {
          tipPercentage,
          tipReason,
          tipRecipient
        },
        userId,
        notes
      );

      // Actualizar el balance de caja
      cashBalance.currentBalance += tipAmount;
      cashBalance.lastTransactionDate = new Date();
      cashBalance.lastTransactionAmount = tipAmount;
      cashBalance.lastTransactionType = 'tip';
      await cashBalance.save();

      // Actualizar la venta con la información de propina
      sale.tipAndChange = {
        tipAmount,
        tipPaymentMethod,
        tipNotes: notes || ''
      };
      sale.totalReceived = sale.total + tipAmount;
      await sale.save();

      // Obtener la transacción con datos poblados
      const populatedTransaction = await CashTransaction.findById(transaction._id)
        .populate('saleId', 'idSale nameClient date total');

      res.status(201).json({
        success: true,
        message: 'Transacción de propina creada exitosamente',
        data: populatedTransaction
      });

    } catch (error) {
      console.error('Error creando transacción de propina:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear transacción de cambio/devolución
  static async createChangeTransaction(req: Request, res: Response) {
    try {
      const { businessId, saleId } = req.params;
      const { 
        changeAmount, 
        changeReason, 
        changeNotes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!changeAmount || changeAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monto de cambio debe ser mayor a 0'
        });
      }

      if (!changeReason) {
        return res.status(400).json({
          success: false,
          message: 'Razón del cambio es requerida'
        });
      }

      // Verificar que la venta existe
      const sale = await Sale.findOne({ businessId, _id: saleId });
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
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

      // Verificar que hay suficiente efectivo en caja
      if (cashBalance.currentBalance < changeAmount) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente efectivo en caja para realizar el cambio'
        });
      }

      // Determinar el método de pago original de la venta
      const originalPaymentMethod = sale.paymentMethod[0]?.payment || 'cash';

      // Crear la transacción de cambio
      const transaction = await CashTransaction.createChangeTransaction(
        businessId,
        saleId,
        changeAmount,
        originalPaymentMethod as 'cash' | 'card' | 'transfer',
        cashBalance.currentBalance,
        {
          changeReason,
          changeNotes,
          originalAmount: sale.total
        },
        userId
      );

      // Actualizar el balance de caja
      cashBalance.currentBalance -= changeAmount;
      cashBalance.lastTransactionDate = new Date();
      cashBalance.lastTransactionAmount = -changeAmount;
      cashBalance.lastTransactionType = 'change';
      await cashBalance.save();

      // Actualizar la venta con la información de cambio
      if (!sale.tipAndChange) {
        sale.tipAndChange = {} as any;
      }
      sale.tipAndChange.changeAmount = changeAmount;
      sale.tipAndChange.changeReason = changeReason;
      sale.tipAndChange.changeNotes = changeNotes;
      sale.totalChange = changeAmount;
      await sale.save();

      // Obtener la transacción con datos poblados
      const populatedTransaction = await CashTransaction.findById(transaction._id)
        .populate('saleId', 'idSale nameClient date total');

      res.status(201).json({
        success: true,
        message: 'Transacción de cambio creada exitosamente',
        data: populatedTransaction
      });

    } catch (error) {
      console.error('Error creando transacción de cambio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear transacción de reembolso
  static async createRefundTransaction(req: Request, res: Response) {
    try {
      const { businessId, saleId } = req.params;
      const { 
        refundAmount, 
        refundMethod, 
        refundReason, 
        refundNotes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!refundAmount || refundAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monto de reembolso debe ser mayor a 0'
        });
      }

      if (!refundReason) {
        return res.status(400).json({
          success: false,
          message: 'Razón del reembolso es requerida'
        });
      }

      // Verificar que la venta existe
      const sale = await Sale.findOne({ businessId, _id: saleId });
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }

      // Verificar que el monto del reembolso no exceda el total de la venta
      if (refundAmount > sale.total) {
        return res.status(400).json({
          success: false,
          message: 'El monto del reembolso no puede exceder el total de la venta'
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

      // Si el reembolso es en efectivo, verificar que hay suficiente
      if (refundMethod === 'cash' && cashBalance.currentBalance < refundAmount) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente efectivo en caja para realizar el reembolso'
        });
      }

      // Determinar el método de pago original de la venta
      const originalPaymentMethod = sale.paymentMethod[0]?.payment || 'cash';

      // Crear la transacción de reembolso
      const transaction = await CashTransaction.createRefundTransaction(
        businessId,
        saleId,
        refundAmount,
        refundMethod,
        originalPaymentMethod as 'cash' | 'card' | 'transfer',
        cashBalance.currentBalance,
        {
          refundReason,
          refundNotes,
          originalPaymentDate: sale.date
        },
        userId
      );

      // Actualizar el balance de caja si es en efectivo
      if (refundMethod === 'cash') {
        cashBalance.currentBalance -= refundAmount;
        cashBalance.lastTransactionDate = new Date();
        cashBalance.lastTransactionAmount = -refundAmount;
        cashBalance.lastTransactionType = 'refund';
        await cashBalance.save();
      }

      // Obtener la transacción con datos poblados
      const populatedTransaction = await CashTransaction.findById(transaction._id)
        .populate('saleId', 'idSale nameClient date total');

      res.status(201).json({
        success: true,
        message: 'Transacción de reembolso creada exitosamente',
        data: populatedTransaction
      });

    } catch (error) {
      console.error('Error creando transacción de reembolso:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear transacción de ajuste de caja
  static async createAdjustmentTransaction(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        saleId,
        adjustmentType, 
        adjustmentAmount, 
        adjustmentReason, 
        adjustmentNotes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!adjustmentAmount || adjustmentAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monto de ajuste debe ser mayor a 0'
        });
      }

      if (!adjustmentReason) {
        return res.status(400).json({
          success: false,
          message: 'Razón del ajuste es requerida'
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

      // Crear la transacción de ajuste
      const transaction = await CashTransaction.createAdjustmentTransaction(
        businessId,
        saleId || 'system', // Si no hay venta específica, usar 'system'
        adjustmentType,
        adjustmentAmount,
        cashBalance.currentBalance,
        {
          adjustmentReason,
          adjustmentNotes,
          approvedBy: userId
        },
        userId
      );

      // Actualizar el balance de caja
      const newBalance = adjustmentType === 'increase' 
        ? cashBalance.currentBalance + adjustmentAmount
        : cashBalance.currentBalance - adjustmentAmount;

      cashBalance.currentBalance = newBalance;
      cashBalance.lastTransactionDate = new Date();
      cashBalance.lastTransactionAmount = adjustmentType === 'increase' ? adjustmentAmount : -adjustmentAmount;
      cashBalance.lastTransactionType = 'adjustment';
      await cashBalance.save();

      // Obtener la transacción con datos poblados
      const populatedTransaction = await CashTransaction.findById(transaction._id)
        .populate('saleId', 'idSale nameClient date total');

      res.status(201).json({
        success: true,
        message: 'Transacción de ajuste creada exitosamente',
        data: populatedTransaction
      });

    } catch (error) {
      console.error('Error creando transacción de ajuste:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar una transacción
  static async approveTransaction(req: Request, res: Response) {
    try {
      const { businessId, transactionId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const transaction = await CashTransaction.findOne({ 
        businessId, 
        _id: transactionId 
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aprobar transacciones pendientes'
        });
      }

      // Aprobar la transacción
      await transaction.approve(userId, notes);

      // Obtener la transacción actualizada
      const updatedTransaction = await CashTransaction.findById(transactionId)
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Transacción aprobada exitosamente',
        data: updatedTransaction
      });

    } catch (error) {
      console.error('Error aprobando transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cancelar una transacción
  static async cancelTransaction(req: Request, res: Response) {
    try {
      const { businessId, transactionId } = req.params;
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

      const transaction = await CashTransaction.findOne({ 
        businessId, 
        _id: transactionId 
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      if (transaction.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar una transacción completada'
        });
      }

      // Cancelar la transacción
      await transaction.cancel(userId, reason);

      // Obtener la transacción actualizada
      const updatedTransaction = await CashTransaction.findById(transactionId)
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Transacción cancelada exitosamente',
        data: updatedTransaction
      });

    } catch (error) {
      console.error('Error cancelando transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Revertir una transacción
  static async reverseTransaction(req: Request, res: Response) {
    try {
      const { businessId, transactionId } = req.params;
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
          message: 'Razón de reversión es requerida'
        });
      }

      const transaction = await CashTransaction.findOne({ 
        businessId, 
        _id: transactionId 
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      if (transaction.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden revertir transacciones completadas'
        });
      }

      // Revertir la transacción
      await transaction.reverse(userId, reason);

      // Obtener la transacción actualizada
      const updatedTransaction = await CashTransaction.findById(transactionId)
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Transacción revertida exitosamente',
        data: updatedTransaction
      });

    } catch (error) {
      console.error('Error revirtiendo transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener reporte de transacciones de caja
  static async getCashTransactionReport(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        transactionType,
        groupBy = 'type' // type, date, status
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (transactionType) filters.transactionType = transactionType;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate as string);
        if (endDate) filters.createdAt.$lte = new Date(endDate as string);
      }

      let reportData;

      if (groupBy === 'type') {
        // Agrupar por tipo de transacción
        reportData = await CashTransaction.aggregate([
          { $match: filters },
          {
            $group: {
              _id: '$transactionType',
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
              byStatus: {
                $push: {
                  status: '$status',
                  amount: '$amount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      } else if (groupBy === 'date') {
        // Agrupar por fecha
        reportData = await CashTransaction.aggregate([
          { $match: filters },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              date: { $first: '$createdAt' },
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
              byType: {
                $push: {
                  type: '$transactionType',
                  amount: '$amount'
                }
              }
            }
          },
          { $sort: { date: -1 } }
        ]);
      } else {
        // Agrupar por estado
        reportData = await CashTransaction.aggregate([
          { $match: filters },
          {
            $group: {
              _id: '$status',
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
              byType: {
                $push: {
                  type: '$transactionType',
                  amount: '$amount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      }

      // Calcular totales generales
      const totals = await CashTransaction.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            },
            completedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
              }
            },
            cancelledAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, '$amount', 0]
              }
            },
            reversedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'reversed'] }, '$amount', 0]
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
            completedAmount: 0,
            cancelledAmount: 0,
            reversedAmount: 0
          },
          filters: {
            startDate,
            endDate,
            transactionType,
            groupBy
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de transacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
