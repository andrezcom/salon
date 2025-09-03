import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Commission from '../models/commission';
import Expert from '../models/expert';
import Sale from '../models/sale';

export class CommissionController {
  
  // Obtener todas las comisiones de un negocio
  static async getCommissions(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        expertId, 
        status, 
        commissionType, 
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (expertId) filters.expertId = expertId;
      if (status) filters.status = status;
      if (commissionType) filters.commissionType = commissionType;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate as string);
        if (endDate) filters.createdAt.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const commissions = await Commission.find(filters)
        .populate('expertId', 'nameExpert aliasExpert')
        .populate('saleId', 'idSale nameClient date total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Commission.countDocuments(filters);

      res.json({
        success: true,
        data: commissions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo comisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener comisiones de un experto específico
  static async getExpertCommissions(req: Request, res: Response) {
    try {
      const { businessId, expertId } = req.params;
      const { 
        status, 
        commissionType, 
        startDate, 
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Verificar que el experto existe
      const expert = await Expert.findOne({ 
        businessId, 
        _id: expertId 
      });

      if (!expert) {
        return res.status(404).json({
          success: false,
          message: 'Experto no encontrado'
        });
      }

      // Construir filtros
      const filters: any = { 
        businessId, 
        expertId 
      };
      
      if (status) filters.status = status;
      if (commissionType) filters.commissionType = commissionType;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate as string);
        if (endDate) filters.createdAt.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);
      
      const commissions = await Commission.find(filters)
        .populate('saleId', 'idSale nameClient date total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Commission.countDocuments(filters);

      // Calcular totales
      const totals = await Commission.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            totalCommissions: { $sum: '$commissionAmount' },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
              }
            },
            approvedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0]
              }
            }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          expert: {
            _id: expert._id,
            nameExpert: expert.nameExpert,
            aliasExpert: expert.aliasExpert,
            commissionSettings: expert.commissionSettings
          },
          commissions,
          totals: totals[0] || {
            totalCommissions: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0
          }
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error obteniendo comisiones del experto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener una comisión específica
  static async getCommission(req: Request, res: Response) {
    try {
      const { businessId, commissionId } = req.params;

      const commission = await Commission.findOne({ 
        businessId, 
        _id: commissionId 
      })
      .populate('expertId', 'nameExpert aliasExpert commissionSettings')
      .populate('saleId', 'idSale nameClient date total services retail');

      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Comisión no encontrada'
        });
      }

      res.json({
        success: true,
        data: commission
      });

    } catch (error) {
      console.error('Error obteniendo comisión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aplicar evento excepcional a una comisión
  static async applyExceptionalEvent(req: Request, res: Response) {
    try {
      const { businessId, commissionId } = req.params;
      const { 
        reason, 
        adjustmentType, 
        adjustmentAmount, 
        adjustmentPercentage,
        notes 
      } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      // Validar campos requeridos
      if (!reason || !adjustmentType || !adjustmentAmount) {
        return res.status(400).json({
          success: false,
          message: 'Razón, tipo de ajuste y monto son requeridos'
        });
      }

      // Buscar la comisión
      const commission = await Commission.findOne({ 
        businessId, 
        _id: commissionId 
      });

      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Comisión no encontrada'
        });
      }

      // Verificar que la comisión esté pendiente
      if (commission.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aplicar eventos excepcionales a comisiones pendientes'
        });
      }

      // Aplicar el evento excepcional
      await commission.applyExceptionalEvent(
        reason,
        adjustmentType,
        adjustmentAmount,
        userId,
        adjustmentPercentage,
        notes
      );

      // Obtener la comisión actualizada
      const updatedCommission = await Commission.findById(commissionId)
        .populate('expertId', 'nameExpert aliasExpert')
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Evento excepcional aplicado exitosamente',
        data: updatedCommission
      });

    } catch (error) {
      console.error('Error aplicando evento excepcional:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar una comisión
  static async approveCommission(req: Request, res: Response) {
    try {
      const { businessId, commissionId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const commission = await Commission.findOne({ 
        businessId, 
        _id: commissionId 
      });

      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Comisión no encontrada'
        });
      }

      if (commission.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aprobar comisiones pendientes'
        });
      }

      commission.status = 'approved';
      commission.updatedBy = userId;
      if (notes) {
        if (!commission.exceptionalEvent) {
          commission.exceptionalEvent = {} as any;
        }
        commission.exceptionalEvent.notes = notes;
      }

      await commission.save();

      const updatedCommission = await Commission.findById(commissionId)
        .populate('expertId', 'nameExpert aliasExpert')
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Comisión aprobada exitosamente',
        data: updatedCommission
      });

    } catch (error) {
      console.error('Error aprobando comisión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Marcar comisión como pagada
  static async markAsPaid(req: Request, res: Response) {
    try {
      const { businessId, commissionId } = req.params;
      const { paymentMethod, notes } = req.body;
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
          message: 'Método de pago requerido'
        });
      }

      const commission = await Commission.findOne({ 
        businessId, 
        _id: commissionId 
      });

      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Comisión no encontrada'
        });
      }

      if (commission.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden pagar comisiones aprobadas'
        });
      }

      await commission.markAsPaid(paymentMethod, notes);

      const updatedCommission = await Commission.findById(commissionId)
        .populate('expertId', 'nameExpert aliasExpert')
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Comisión marcada como pagada exitosamente',
        data: updatedCommission
      });

    } catch (error) {
      console.error('Error marcando comisión como pagada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cancelar una comisión
  static async cancelCommission(req: Request, res: Response) {
    try {
      const { businessId, commissionId } = req.params;
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
          message: 'Razón de cancelación requerida'
        });
      }

      const commission = await Commission.findOne({ 
        businessId, 
        _id: commissionId 
      });

      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Comisión no encontrada'
        });
      }

      if (commission.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar una comisión ya pagada'
        });
      }

      commission.status = 'cancelled';
      commission.updatedBy = userId;
      if (!commission.exceptionalEvent) {
        commission.exceptionalEvent = {} as any;
      }
      commission.exceptionalEvent.notes = `Cancelada: ${reason}`;

      await commission.save();

      const updatedCommission = await Commission.findById(commissionId)
        .populate('expertId', 'nameExpert aliasExpert')
        .populate('saleId', 'idSale nameClient date total');

      res.json({
        success: true,
        message: 'Comisión cancelada exitosamente',
        data: updatedCommission
      });

    } catch (error) {
      console.error('Error cancelando comisión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Recalcular comisiones de una venta
  static async recalculateSaleCommissions(req: Request, res: Response) {
    try {
      const { businessId, saleId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
      }

      const sale = await Sale.findOne({ 
        businessId, 
        _id: saleId 
      });

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }

      // Recalcular comisiones
      await sale.calculateCommissions();

      // Obtener la venta actualizada
      const updatedSale = await Sale.findById(saleId)
        .populate('commissions.expertId', 'nameExpert aliasExpert');

      res.json({
        success: true,
        message: 'Comisiones recalculadas exitosamente',
        data: updatedSale
      });

    } catch (error) {
      console.error('Error recalculando comisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener reporte de comisiones
  static async getCommissionReport(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { 
        startDate, 
        endDate, 
        expertId, 
        commissionType,
        groupBy = 'expert' // expert, date, status
      } = req.query;

      // Construir filtros
      const filters: any = { businessId };
      
      if (expertId) filters.expertId = expertId;
      if (commissionType) filters.commissionType = commissionType;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate as string);
        if (endDate) filters.createdAt.$lte = new Date(endDate as string);
      }

      let reportData;

      if (groupBy === 'expert') {
        // Agrupar por experto
        reportData = await Commission.aggregate([
          { $match: filters },
          {
            $lookup: {
              from: 'experts',
              localField: 'expertId',
              foreignField: '_id',
              as: 'expert'
            }
          },
          { $unwind: '$expert' },
          {
            $group: {
              _id: '$expertId',
              expertName: { $first: '$expert.nameExpert' },
              expertAlias: { $first: '$expert.aliasExpert' },
              totalCommissions: { $sum: '$commissionAmount' },
              totalCount: { $sum: 1 },
              pendingAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
                }
              },
              approvedAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
                }
              },
              paidAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0]
                }
              },
              cancelledAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'cancelled'] }, '$commissionAmount', 0]
                }
              },
              byType: {
                $push: {
                  type: '$commissionType',
                  amount: '$commissionAmount',
                  status: '$status'
                }
              }
            }
          },
          { $sort: { totalCommissions: -1 } }
        ]);
      } else if (groupBy === 'date') {
        // Agrupar por fecha
        reportData = await Commission.aggregate([
          { $match: filters },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              date: { $first: '$createdAt' },
              totalCommissions: { $sum: '$commissionAmount' },
              totalCount: { $sum: 1 },
              byStatus: {
                $push: {
                  status: '$status',
                  amount: '$commissionAmount'
                }
              }
            }
          },
          { $sort: { date: -1 } }
        ]);
      } else {
        // Agrupar por estado
        reportData = await Commission.aggregate([
          { $match: filters },
          {
            $group: {
              _id: '$status',
              totalCommissions: { $sum: '$commissionAmount' },
              totalCount: { $sum: 1 },
              byExpert: {
                $push: {
                  expertId: '$expertId',
                  amount: '$commissionAmount'
                }
              }
            }
          },
          { $sort: { totalCommissions: -1 } }
        ]);
      }

      // Calcular totales generales
      const totals = await Commission.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            totalCommissions: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
              }
            },
            approvedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0]
              }
            },
            cancelledAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, '$commissionAmount', 0]
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
            totalCommissions: 0,
            totalCount: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0,
            cancelledAmount: 0
          },
          filters: {
            startDate,
            endDate,
            expertId,
            commissionType,
            groupBy
          }
        }
      });

    } catch (error) {
      console.error('Error generando reporte de comisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
