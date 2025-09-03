import { Request, Response } from 'express';
import Commission from '../models/commission';
import Expert from '../models/expert';
import Sale from '../models/sale';

export class DashboardController {
  
  // Dashboard principal de comisiones
  static async getCommissionDashboard(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { startDate, endDate } = req.query;

      // Construir filtros de fecha
      const dateFilters: any = {};
      if (startDate || endDate) {
        dateFilters.createdAt = {};
        if (startDate) dateFilters.createdAt.$gte = new Date(startDate as string);
        if (endDate) dateFilters.createdAt.$lte = new Date(endDate as string);
      }

      // 1. Resumen general de comisiones
      const generalSummary = await Commission.aggregate([
        { $match: { businessId, ...dateFilters } },
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

      // 2. Top 5 expertos por comisiones
      const topExperts = await Commission.aggregate([
        { $match: { businessId, ...dateFilters } },
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
            }
          }
        },
        { $sort: { totalCommissions: -1 } },
        { $limit: 5 }
      ]);

      // 3. Comisiones por tipo
      const byType = await Commission.aggregate([
        { $match: { businessId, ...dateFilters } },
        {
          $group: {
            _id: '$commissionType',
            totalAmount: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                amount: '$commissionAmount'
              }
            }
          }
        }
      ]);

      // 4. Comisiones por estado
      const byStatus = await Commission.aggregate([
        { $match: { businessId, ...dateFilters } },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      // 5. Comisiones por mes (últimos 12 meses)
      const monthlyTrend = await Commission.aggregate([
        { $match: { businessId, ...dateFilters } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            month: { $first: '$createdAt' },
            totalAmount: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                amount: '$commissionAmount'
              }
            }
          }
        },
        { $sort: { month: -1 } },
        { $limit: 12 }
      ]);

      // 6. Comisiones pendientes de aprobación (últimas 10)
      const pendingCommissions = await Commission.find({ 
        businessId, 
        status: 'pending',
        ...dateFilters
      })
      .populate('expertId', 'nameExpert aliasExpert')
      .populate('saleId', 'idSale nameClient date total')
      .sort({ createdAt: -1 })
      .limit(10);

      // 7. Comisiones aprobadas pendientes de pago (últimas 10)
      const approvedCommissions = await Commission.find({ 
        businessId, 
        status: 'approved',
        ...dateFilters
      })
      .populate('expertId', 'nameExpert aliasExpert')
      .populate('saleId', 'idSale nameClient date total')
      .sort({ createdAt: -1 })
      .limit(10);

      // 8. Eventos excepcionales recientes
      const exceptionalEvents = await Commission.find({ 
        businessId, 
        'exceptionalEvent.reason': { $exists: true, $ne: null },
        ...dateFilters
      })
      .populate('expertId', 'nameExpert aliasExpert')
      .populate('saleId', 'idSale nameClient date total')
      .sort({ 'exceptionalEvent.approvalDate': -1 })
      .limit(10);

      // 9. Estadísticas de ventas con comisiones
      const salesStats = await Sale.aggregate([
        { $match: { businessId, ...dateFilters } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: '$total' },
            salesWithCommissions: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ['$commissions', []] } }, 0] },
                  1,
                  0
                ]
              }
            },
            totalCommissions: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ['$commissions', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.commissionAmount'] }
                }
              }
            }
          }
        }
      ]);

      // 10. Configuración de expertos activos
      const activeExperts = await Expert.find({ 
        businessId, 
        active: true 
      })
      .select('nameExpert aliasExpert commissionSettings')
      .sort({ nameExpert: 1 });

      res.json({
        success: true,
        data: {
          summary: generalSummary[0] || {
            totalCommissions: 0,
            totalCount: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0,
            cancelledAmount: 0
          },
          topExperts,
          byType,
          byStatus,
          monthlyTrend,
          pendingCommissions,
          approvedCommissions,
          exceptionalEvents,
          salesStats: salesStats[0] || {
            totalSales: 0,
            totalAmount: 0,
            salesWithCommissions: 0,
            totalCommissions: 0
          },
          activeExperts,
          filters: {
            startDate,
            endDate
          },
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Error obteniendo dashboard de comisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Dashboard específico de un experto
  static async getExpertDashboard(req: Request, res: Response) {
    try {
      const { businessId, expertId } = req.params;
      const { startDate, endDate } = req.query;

      // Verificar que el experto existe
      const expert = await Expert.findOne({ 
        businessId, 
        _id: expertId,
        active: true 
      });

      if (!expert) {
        return res.status(404).json({
          success: false,
          message: 'Experto no encontrado'
        });
      }

      // Construir filtros de fecha
      const dateFilters: any = {};
      if (startDate || endDate) {
        dateFilters.createdAt = {};
        if (startDate) dateFilters.createdAt.$gte = new Date(startDate as string);
        if (endDate) dateFilters.createdAt.$lte = new Date(endDate as string);
      }

      // 1. Resumen de comisiones del experto
      const commissionSummary = await Commission.aggregate([
        { $match: { businessId, expertId, ...dateFilters } },
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

      // 2. Comisiones por tipo
      const byType = await Commission.aggregate([
        { $match: { businessId, expertId, ...dateFilters } },
        {
          $group: {
            _id: '$commissionType',
            totalAmount: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                amount: '$commissionAmount'
              }
            }
          }
        }
      ]);

      // 3. Comisiones por mes (últimos 12 meses)
      const monthlyTrend = await Commission.aggregate([
        { $match: { businessId, expertId, ...dateFilters } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            month: { $first: '$createdAt' },
            totalAmount: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                amount: '$commissionAmount'
              }
            }
          }
        },
        { $sort: { month: -1 } },
        { $limit: 12 }
      ]);

      // 4. Últimas comisiones
      const recentCommissions = await Commission.find({ 
        businessId, 
        expertId,
        ...dateFilters
      })
      .populate('saleId', 'idSale nameClient date total')
      .sort({ createdAt: -1 })
      .limit(20);

      // 5. Eventos excepcionales del experto
      const exceptionalEvents = await Commission.find({ 
        businessId, 
        expertId,
        'exceptionalEvent.reason': { $exists: true, $ne: null },
        ...dateFilters
      })
      .populate('saleId', 'idSale nameClient date total')
      .sort({ 'exceptionalEvent.approvalDate': -1 })
      .limit(10);

      // 6. Ventas del experto
      const salesStats = await Sale.aggregate([
        { $match: { businessId, ...dateFilters } },
        {
          $unwind: '$services'
        },
        {
          $match: {
            'services.expertId': expertId
          }
        },
        {
          $group: {
            _id: null,
            totalServices: { $sum: 1 },
            totalServiceAmount: { $sum: '$services.amount' },
            totalInputCosts: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ['$services.input', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.amount'] }
                }
              }
            }
          }
        }
      ]);

      // 7. Retail del experto
      const retailStats = await Sale.aggregate([
        { $match: { businessId, ...dateFilters } },
        {
          $unwind: '$retail'
        },
        {
          $match: {
            'retail.expertId': expertId
          }
        },
        {
          $group: {
            _id: null,
            totalRetail: { $sum: 1 },
            totalRetailAmount: { $sum: '$retail.amount' }
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
          summary: commissionSummary[0] || {
            totalCommissions: 0,
            totalCount: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0,
            cancelledAmount: 0
          },
          byType,
          monthlyTrend,
          recentCommissions,
          exceptionalEvents,
          salesStats: salesStats[0] || {
            totalServices: 0,
            totalServiceAmount: 0,
            totalInputCosts: 0
          },
          retailStats: retailStats[0] || {
            totalRetail: 0,
            totalRetailAmount: 0
          },
          filters: {
            startDate,
            endDate
          },
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Error obteniendo dashboard del experto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Alertas y notificaciones del dashboard
  static async getDashboardAlerts(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      const alerts = [];

      // 1. Comisiones pendientes de aprobación (más de 7 días)
      const oldPendingCommissions = await Commission.find({
        businessId,
        status: 'pending',
        createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).count();

      if (oldPendingCommissions > 0) {
        alerts.push({
          type: 'warning',
          title: 'Comisiones pendientes antiguas',
          message: `${oldPendingCommissions} comisiones han estado pendientes por más de 7 días`,
          count: oldPendingCommissions,
          priority: 'medium'
        });
      }

      // 2. Comisiones aprobadas pendientes de pago (más de 30 días)
      const oldApprovedCommissions = await Commission.find({
        businessId,
        status: 'approved',
        createdAt: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).count();

      if (oldApprovedCommissions > 0) {
        alerts.push({
          type: 'danger',
          title: 'Comisiones aprobadas sin pago',
          message: `${oldApprovedCommissions} comisiones han estado aprobadas por más de 30 días sin ser pagadas`,
          count: oldApprovedCommissions,
          priority: 'high'
        });
      }

      // 3. Expertos sin comisiones en el último mes
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const activeExperts = await Expert.find({ businessId, active: true });
      const expertsWithCommissions = await Commission.distinct('expertId', {
        businessId,
        createdAt: { $gte: lastMonth }
      });

      const inactiveExperts = activeExperts.filter(
        expert => !expertsWithCommissions.includes(expert._id.toString())
      );

      if (inactiveExperts.length > 0) {
        alerts.push({
          type: 'info',
          title: 'Expertos inactivos',
          message: `${inactiveExperts.length} expertos no han generado comisiones en el último mes`,
          count: inactiveExperts.length,
          priority: 'low',
          details: inactiveExperts.map(expert => ({
            id: expert._id,
            name: expert.nameExpert,
            alias: expert.aliasExpert
          }))
        });
      }

      // 4. Eventos excepcionales recientes (últimas 24 horas)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentExceptionalEvents = await Commission.find({
        businessId,
        'exceptionalEvent.approvalDate': { $gte: last24Hours }
      }).count();

      if (recentExceptionalEvents > 0) {
        alerts.push({
          type: 'info',
          title: 'Eventos excepcionales recientes',
          message: `${recentExceptionalEvents} eventos excepcionales han sido aplicados en las últimas 24 horas`,
          count: recentExceptionalEvents,
          priority: 'low'
        });
      }

      // 5. Comisiones con montos muy altos o muy bajos
      const highCommissions = await Commission.find({
        businessId,
        commissionAmount: { $gte: 1000 } // Comisiones de $1000 o más
      }).count();

      if (highCommissions > 0) {
        alerts.push({
          type: 'info',
          title: 'Comisiones de alto valor',
          message: `${highCommissions} comisiones tienen un valor de $1000 o más`,
          count: highCommissions,
          priority: 'low'
        });
      }

      res.json({
        success: true,
        data: {
          alerts,
          totalAlerts: alerts.length,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Error obteniendo alertas del dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
