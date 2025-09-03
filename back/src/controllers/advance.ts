import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Advance from '../models/advance';
import Expert from '../models/expert';
import CashBalance from '../models/cashBalance';
import CashTransaction from '../models/cashTransaction';

export class AdvanceController {
  
  // Obtener todos los anticipos de un negocio
  static async getAdvances(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        expertId, 
        status, 
        advanceType,
        category,
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (expertId) filters.expertId = expertId;
      if (status) filters.status = status;
      if (advanceType) filters.advanceType = advanceType;
      if (category) filters.category = category;
      
      if (startDate || endDate) {
        filters.requestDate = {};
        if (startDate) filters.requestDate.$gte = new Date(startDate as string);
        if (endDate) filters.requestDate.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const advances = await Advance.find(filters)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ requestDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Advance.countDocuments(filters);

      res.json({
        success: true,
        data: advances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo anticipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener un anticipo específico
  static async getAdvance(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      })
      .populate('expertId', 'nameExpert aliasExpert email phone')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      res.json({
        success: true,
        data: advance
      });

    } catch (error) {
      console.error('Error obteniendo anticipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear solicitud de anticipo
  static async createAdvance(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        expertId,
        advanceType,
        amount,
        reason,
        description,
        category,
        dueDate,
        isLoan,
        interestRate,
        expenseReceipts
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!expertId || !amount || !reason) {
        return res.status(400).json({
          success: false,
          message: 'expertId, amount y reason son requeridos'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }

      // Verificar que el experto existe
      const expert = await Expert.findOne({ businessId, _id: expertId });
      if (!expert) {
        return res.status(404).json({
          success: false,
          message: 'Experto no encontrado'
        });
      }

      // Crear el anticipo
      const advance = await Advance.createAdvance(
        businessId,
        expertId,
        advanceType,
        amount,
        reason,
        userId,
        {
          description,
          category,
          dueDate,
          isLoan,
          interestRate,
          expenseReceipts
        }
      );

      // Obtener el anticipo con datos poblados
      const populatedAdvance = await Advance.findById(advance._id)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Solicitud de anticipo creada exitosamente',
        data: populatedAdvance
      });

    } catch (error) {
      console.error('Error creando anticipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar anticipo
  static async approveAdvance(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;
      const { 
        approvedAmount, 
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!approvedAmount || approvedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monto aprobado debe ser mayor a 0'
        });
      }

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      });

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      if (advance.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aprobar anticipos pendientes'
        });
      }

      // Aprobar el anticipo
      await advance.approve(userId, approvedAmount, notes);

      // Obtener el anticipo actualizado
      const updatedAdvance = await Advance.findById(advanceId)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: 'Anticipo aprobado exitosamente',
        data: updatedAdvance
      });

    } catch (error) {
      console.error('Error aprobando anticipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Rechazar anticipo
  static async rejectAdvance(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;
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

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      });

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      if (advance.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden rechazar anticipos pendientes'
        });
      }

      // Rechazar el anticipo
      await advance.reject(userId, rejectionReason, notes);

      // Obtener el anticipo actualizado
      const updatedAdvance = await Advance.findById(advanceId)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email')
        .populate('rejectedBy', 'name email');

      res.json({
        success: true,
        message: 'Anticipo rechazado exitosamente',
        data: updatedAdvance
      });

    } catch (error) {
      console.error('Error rechazando anticipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Marcar anticipo como pagado
  static async markAdvanceAsPaid(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;
      const { 
        paymentMethod, 
        paymentNotes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Método de pago es requerido'
        });
      }

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      });

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      if (advance.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden pagar anticipos aprobados'
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
      if (paymentMethod === 'cash' && cashBalance.currentBalance < advance.approvedAmount) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente efectivo en caja para realizar el pago'
        });
      }

      // Marcar como pagado
      await advance.markAsPaid(paymentMethod, paymentNotes);

      // Si es pago en efectivo, actualizar balance de caja
      if (paymentMethod === 'cash') {
        cashBalance.currentBalance -= advance.approvedAmount;
        cashBalance.lastTransactionDate = new Date();
        cashBalance.lastTransactionAmount = -advance.approvedAmount;
        cashBalance.lastTransactionType = 'advance_payment';
        await cashBalance.save();

        // Crear transacción de caja
        await CashTransaction.createAdjustmentTransaction(
          businessId,
          advanceId,
          'decrease',
          advance.approvedAmount,
          cashBalance.currentBalance + advance.approvedAmount,
          {
            adjustmentReason: `Pago de anticipo a ${advance.expertId}`,
            adjustmentNotes: `Anticipo ID: ${advanceId}`,
            approvedBy: userId
          },
          userId
        );
      }

      // Obtener el anticipo actualizado
      const updatedAdvance = await Advance.findById(advanceId)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: 'Anticipo marcado como pagado exitosamente',
        data: updatedAdvance
      });

    } catch (error) {
      console.error('Error marcando anticipo como pagado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cancelar anticipo
  static async cancelAdvance(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;
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

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      });

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      if (advance.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar un anticipo ya pagado'
        });
      }

      // Cancelar el anticipo
      await advance.cancel(userId, reason);

      // Obtener el anticipo actualizado
      const updatedAdvance = await Advance.findById(advanceId)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email');

      res.json({
        success: true,
        message: 'Anticipo cancelado exitosamente',
        data: updatedAdvance
      });

    } catch (error) {
      console.error('Error cancelando anticipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aplicar descuento de comisión
  static async applyCommissionDeduction(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;
      const { 
        commissionId, 
        amount, 
        description 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      if (!commissionId || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: 'commissionId, amount y description son requeridos'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      });

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      if (advance.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aplicar descuentos a anticipos pagados'
        });
      }

      // Aplicar descuento
      await advance.applyCommissionDeduction(commissionId, amount, description);

      // Obtener el anticipo actualizado
      const updatedAdvance = await Advance.findById(advanceId)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: 'Descuento de comisión aplicado exitosamente',
        data: updatedAdvance
      });

    } catch (error) {
      console.error('Error aplicando descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Marcar anticipo como reembolsado
  static async markAdvanceAsRepaid(req: Request, res: Response) {
    try {
      const { businessId, advanceId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const advance = await Advance.findOne({ 
        businessId, 
        _id: advanceId 
      });

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Anticipo no encontrado'
        });
      }

      if (advance.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden marcar como reembolsados anticipos pagados'
        });
      }

      if (advance.remainingBalance > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede marcar como reembolsado si hay balance pendiente'
        });
      }

      // Marcar como reembolsado
      await advance.markAsRepaid();

      // Obtener el anticipo actualizado
      const updatedAdvance = await Advance.findById(advanceId)
        .populate('expertId', 'nameExpert aliasExpert email')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email');

      res.json({
        success: true,
        message: 'Anticipo marcado como reembolsado exitosamente',
        data: updatedAdvance
      });

    } catch (error) {
      console.error('Error marcando anticipo como reembolsado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen de anticipos por experto
  static async getExpertAdvanceSummary(req: Request, res: Response) {
    try {
      const { businessId, expertId } = req.params;

      const summary = await Advance.getExpertAdvanceSummary(businessId, expertId);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error obteniendo resumen de anticipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener reporte de anticipos
  static async getAdvanceReport(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        advanceType,
        status,
        groupBy = 'type' // type, status, expert, category
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (advanceType) filters.advanceType = advanceType;
      if (status) filters.status = status;
      
      if (startDate || endDate) {
        filters.requestDate = {};
        if (startDate) filters.requestDate.$gte = new Date(startDate as string);
        if (endDate) filters.requestDate.$lte = new Date(endDate as string);
      }

      let reportData;

      if (groupBy === 'type') {
        // Agrupar por tipo de anticipo
        reportData = await Advance.aggregate([
          { $match: filters },
          {
            $group: {
              _id: '$advanceType',
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
      } else if (groupBy === 'status') {
        // Agrupar por estado
        reportData = await Advance.aggregate([
          { $match: filters },
          {
            $group: {
              _id: '$status',
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
              byType: {
                $push: {
                  type: '$advanceType',
                  amount: '$amount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      } else if (groupBy === 'expert') {
        // Agrupar por experto
        reportData = await Advance.aggregate([
          { $match: filters },
          {
            $lookup: {
              from: 'experts',
              localField: 'expertId',
              foreignField: '_id',
              as: 'expert'
            }
          },
          {
            $group: {
              _id: '$expertId',
              expertName: { $first: '$expert.nameExpert' },
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
      } else {
        // Agrupar por categoría
        reportData = await Advance.aggregate([
          { $match: filters },
          {
            $group: {
              _id: '$category',
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
              byType: {
                $push: {
                  type: '$advanceType',
                  amount: '$amount'
                }
              }
            }
          },
          { $sort: { totalAmount: -1 } }
        ]);
      }

      // Calcular totales generales
      const totals = await Advance.aggregate([
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
            approvedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
              }
            },
            rejectedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0]
              }
            },
            cancelledAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, '$amount', 0]
              }
            },
            repaidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'repaid'] }, '$amount', 0]
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
            cancelledAmount: 0,
            repaidAmount: 0
          },
          filters: {
            startDate,
            endDate,
            advanceType,
            status,
            groupBy
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de anticipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
