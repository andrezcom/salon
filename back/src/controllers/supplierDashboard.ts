import { Request, Response } from 'express';
import SupplierAnalytics from '../models/supplierAnalytics';
import Supplier from '../models/supplier';
import Product from '../models/product';
import AccountsPayable from '../models/accountsPayable';
import PurchaseOrder from '../models/purchaseOrder';

export class SupplierDashboardController {
  
  // Obtener dashboard ejecutivo
  static async getExecutiveDashboard(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;
      const { period = 'monthly' } = req.query;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Calcular fechas del período
      const { startDate, endDate } = SupplierDashboardController.getPeriodDates(period as string);

      // Obtener métricas generales
      const generalMetrics = await SupplierDashboardController.getGeneralMetrics(businessId, startDate, endDate);
      
      // Obtener métricas financieras
      const financialMetrics = await SupplierDashboardController.getFinancialMetrics(businessId, startDate, endDate);
      
      // Obtener métricas de rendimiento
      const performanceMetrics = await SupplierDashboardController.getPerformanceMetrics(businessId, startDate, endDate);
      
      // Obtener top proveedores
      const topSuppliers = await SupplierDashboardController.getTopSuppliers(businessId, startDate, endDate);
      
      // Obtener análisis de riesgo
      const riskAnalysis = await SupplierDashboardController.getRiskAnalysis(businessId);
      
      // Obtener tendencias
      const trends = await SupplierDashboardController.getTrends(businessId, startDate, endDate);
      
      // Obtener alertas
      const alerts = await SupplierDashboardController.getAlerts(businessId);
      
      // Obtener recomendaciones
      const recommendations = await SupplierDashboardController.getRecommendations(businessId);

      const dashboard = {
        period: {
          type: period,
          startDate,
          endDate
        },
        generalMetrics,
        financialMetrics,
        performanceMetrics,
        topSuppliers,
        riskAnalysis,
        trends,
        alerts,
        recommendations,
        generatedAt: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Dashboard ejecutivo obtenido exitosamente',
        data: dashboard
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Generar analytics automáticamente
  static async generateAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { periodType = 'monthly' } = req.body;
      const businessId = req.user?.businessId;
      const generatedBy = req.user?.id;

      if (!businessId || !generatedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y generatedBy son requeridos'
        });
        return;
      }

      // Calcular fechas del período
      const { startDate, endDate } = SupplierDashboardController.getPeriodDates(periodType);

      // Verificar si ya existe analytics para este período
      const existingAnalytics = await SupplierAnalytics.findOne({
        businessId,
        'period.startDate': startDate,
        'period.endDate': endDate,
        'period.type': periodType
      });

      if (existingAnalytics) {
        res.status(400).json({
          success: false,
          message: 'Ya existen analytics para este período'
        });
        return;
      }

      // Generar analytics
      const analytics = await SupplierDashboardController.generateAnalyticsData(
        businessId,
        periodType,
        startDate,
        endDate,
        generatedBy
      );

      const analyticsDoc = new SupplierAnalytics(analytics);
      await analyticsDoc.save();

      res.status(201).json({
        success: true,
        message: 'Analytics generados exitosamente',
        data: analyticsDoc
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener analytics históricos
  static async getHistoricalAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const {
        businessId,
        periodType,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = req.query;

      const businessIdFilter = businessId || req.user?.businessId;
      
      if (!businessIdFilter) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Construir filtros
      const filters: any = { businessId: businessIdFilter };
      
      if (periodType) {
        filters['period.type'] = periodType;
      }
      
      if (startDate && endDate) {
        filters['period.startDate'] = { $gte: new Date(startDate as string) };
        filters['period.endDate'] = { $lte: new Date(endDate as string) };
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const analytics = await SupplierAnalytics.find(filters)
        .populate('generatedBy', 'firstName lastName')
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await SupplierAnalytics.countDocuments(filters);

      res.status(200).json({
        success: true,
        message: 'Analytics históricos obtenidos exitosamente',
        data: {
          analytics,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener reporte de proveedores
  static async getSupplierReport(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const { startDate, endDate } = req.query;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Obtener proveedor
      const supplier = await Supplier.findOne({ _id: supplierId, businessId });
      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      // Calcular fechas
      const reportStartDate = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const reportEndDate = endDate ? new Date(endDate as string) : new Date();

      // Obtener datos del proveedor
      const supplierData = await SupplierDashboardController.getSupplierDetailedData(
        businessId,
        supplierId,
        reportStartDate,
        reportEndDate
      );

      res.status(200).json({
        success: true,
        message: 'Reporte de proveedor obtenido exitosamente',
        data: {
          supplier: {
            id: supplier._id,
            name: supplier.name,
            code: supplier.code,
            type: supplier.type,
            status: supplier.status,
            rating: supplier.rating
          },
          period: {
            startDate: reportStartDate,
            endDate: reportEndDate
          },
          ...supplierData
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Métodos privados auxiliares
  private static getPeriodDates(periodType: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (periodType) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private static async getGeneralMetrics(businessId: string, startDate: Date, endDate: Date) {
    const totalSuppliers = await Supplier.countDocuments({ businessId });
    const activeSuppliers = await Supplier.countDocuments({ businessId, status: 'active' });
    const inactiveSuppliers = await Supplier.countDocuments({ businessId, status: 'inactive' });
    
    const newSuppliers = await Supplier.countDocuments({
      businessId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const suppliersByType = await Supplier.aggregate([
      { $match: { businessId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const typeMap = {
      manufacturer: 0,
      distributor: 0,
      wholesaler: 0,
      retailer: 0
    };

    suppliersByType.forEach(item => {
      typeMap[item._id as keyof typeof typeMap] = item.count;
    });

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      newSuppliers,
      suppliersByType: typeMap
    };
  }

  private static async getFinancialMetrics(businessId: string, startDate: Date, endDate: Date) {
    // Obtener métricas de cuentas por pagar
    const payablesSummary = await AccountsPayable.aggregate([
      {
        $match: {
          businessId,
          invoiceDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchaseValue: { $sum: '$totalAmount' },
          totalPayments: { $sum: '$paidAmount' },
          outstandingPayables: { $sum: '$balanceAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const summary = payablesSummary[0] || {
      totalPurchaseValue: 0,
      totalPayments: 0,
      outstandingPayables: 0,
      averageOrderValue: 0
    };

    return {
      totalPurchaseValue: summary.totalPurchaseValue,
      averageOrderValue: summary.averageOrderValue,
      totalPayments: summary.totalPayments,
      outstandingPayables: summary.outstandingPayables,
      averagePaymentTime: 30, // Valor por defecto
      costSavings: 0, // Se calcularía comparando con períodos anteriores
      priceTrends: {
        increasing: 0,
        stable: 0,
        decreasing: 0
      }
    };
  }

  private static async getPerformanceMetrics(businessId: string, startDate: Date, endDate: Date) {
    // Obtener métricas de órdenes de compra
    const ordersSummary = await PurchaseOrder.aggregate([
      {
        $match: {
          businessId,
          orderDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageDeliveryTime: { $avg: '$leadTime' }
        }
      }
    ]);

    const summary = ordersSummary[0] || {
      totalOrders: 0,
      completedOrders: 0,
      averageDeliveryTime: 7
    };

    const onTimeDeliveryRate = summary.totalOrders > 0 ? 
      (summary.completedOrders / summary.totalOrders) * 100 : 0;

    return {
      averageDeliveryTime: summary.averageDeliveryTime,
      onTimeDeliveryRate,
      qualityScore: 4, // Valor por defecto
      defectRate: 2, // Valor por defecto
      returnRate: 1, // Valor por defecto
      customerSatisfaction: 4 // Valor por defecto
    };
  }

  private static async getTopSuppliers(businessId: string, startDate: Date, endDate: Date) {
    // Top por volumen
    const byVolume = await AccountsPayable.aggregate([
      {
        $match: {
          businessId,
          invoiceDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          totalValue: { $sum: '$totalAmount' },
          supplierName: { $first: '$supplierName' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 }
    ]);

    // Top por calidad (basado en rating)
    const byQuality = await Supplier.find({ businessId })
      .sort({ rating: -1 })
      .limit(5)
      .select('_id name rating');

    // Top por entrega (basado en órdenes completadas)
    const byDelivery = await PurchaseOrder.aggregate([
      {
        $match: {
          businessId,
          status: 'completed',
          orderDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          completedOrders: { $sum: 1 },
          averageDeliveryTime: { $avg: '$leadTime' },
          supplierName: { $first: '$supplierName' }
        }
      },
      { $sort: { completedOrders: -1 } },
      { $limit: 5 }
    ]);

    // Top por costo (proveedores con mejores precios)
    const byCost = await Supplier.find({ businessId })
      .sort({ rating: -1 }) // Usar rating como proxy para costo
      .limit(5)
      .select('_id name rating');

    return {
      byVolume: byVolume.map(item => ({
        supplierId: item._id,
        supplierName: item.supplierName,
        totalValue: item.totalValue,
        percentage: 0 // Se calcularía
      })),
      byQuality: byQuality.map(supplier => ({
        supplierId: supplier._id,
        supplierName: supplier.name,
        qualityScore: supplier.rating,
        defectRate: 0 // Se calcularía
      })),
      byDelivery: byDelivery.map(item => ({
        supplierId: item._id,
        supplierName: item.supplierName,
        deliveryTime: item.averageDeliveryTime,
        reliability: 95 // Valor por defecto
      })),
      byCost: byCost.map(supplier => ({
        supplierId: supplier._id,
        supplierName: supplier.name,
        averageCost: 0, // Se calcularía
        costSavings: 0 // Se calcularía
      }))
    };
  }

  private static async getRiskAnalysis(businessId: string) {
    // Obtener proveedores con cuentas vencidas
    const overdueSuppliers = await AccountsPayable.aggregate([
      {
        $match: {
          businessId,
          status: 'overdue'
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          overdueAmount: { $sum: '$balanceAmount' }
        }
      }
    ]);

    return {
      highRiskSuppliers: overdueSuppliers.map(item => ({
        supplierId: item._id,
        supplierName: item.supplierName,
        riskFactors: ['Cuentas vencidas'],
        riskScore: 80
      })),
      suppliersAtRisk: [],
      contractExpirations: []
    };
  }

  private static async getTrends(businessId: string, startDate: Date, endDate: Date) {
    // Obtener datos del período anterior para comparar
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime());

    const currentPeriod = await AccountsPayable.aggregate([
      {
        $match: {
          businessId,
          invoiceDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalAmount' },
          averageValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const previousPeriod = await AccountsPayable.aggregate([
      {
        $match: {
          businessId,
          invoiceDate: { $gte: previousStartDate, $lte: previousEndDate }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalAmount' },
          averageValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const current = currentPeriod[0] || { totalValue: 0, averageValue: 0 };
    const previous = previousPeriod[0] || { totalValue: 0, averageValue: 0 };

    const purchaseTrend = current.totalValue > previous.totalValue ? 'increasing' : 
                         current.totalValue < previous.totalValue ? 'decreasing' : 'stable';

    return {
      purchaseTrend,
      priceTrend: 'stable', // Se calcularía comparando precios
      qualityTrend: 'stable', // Se calcularía comparando ratings
      deliveryTrend: 'stable', // Se calcularía comparando tiempos de entrega
      predictions: {
        nextMonthPurchase: current.totalValue * 1.1, // Estimación simple
        nextMonthCost: current.averageValue * 1.05,
        recommendedActions: [
          'Monitorear proveedores con cuentas vencidas',
          'Evaluar nuevos proveedores para diversificar',
          'Negociar mejores términos de pago'
        ]
      }
    };
  }

  private static async getAlerts(businessId: string) {
    const alerts = [];

    // Verificar cuentas vencidas
    const overdueCount = await AccountsPayable.countDocuments({
      businessId,
      status: 'overdue'
    });

    if (overdueCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Cuentas Vencidas',
        message: `Tienes ${overdueCount} cuentas vencidas con proveedores`,
        priority: 'high',
        actionRequired: true
      });
    }

    // Verificar contratos próximos a vencer
    const expiringContracts = await Supplier.countDocuments({
      businessId,
      // Aquí se verificarían contratos próximos a vencer
    });

    if (expiringContracts > 0) {
      alerts.push({
        type: 'info',
        title: 'Contratos Próximos a Vencer',
        message: `${expiringContracts} contratos están próximos a vencer`,
        priority: 'medium',
        actionRequired: true
      });
    }

    return alerts;
  }

  private static async getRecommendations(businessId: string) {
    return [
      {
        category: 'cost',
        title: 'Optimizar Costos',
        description: 'Considera negociar mejores precios con tus principales proveedores',
        impact: 'high',
        effort: 'medium',
        priority: 8,
        suppliers: []
      },
      {
        category: 'quality',
        title: 'Mejorar Calidad',
        description: 'Implementa evaluaciones regulares de calidad de proveedores',
        impact: 'high',
        effort: 'low',
        priority: 7,
        suppliers: []
      },
      {
        category: 'delivery',
        title: 'Optimizar Entregas',
        description: 'Establece acuerdos de nivel de servicio con proveedores críticos',
        impact: 'medium',
        effort: 'medium',
        priority: 6,
        suppliers: []
      }
    ];
  }

  private static async generateAnalyticsData(
    businessId: string,
    periodType: string,
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ) {
    const generalMetrics = await SupplierDashboardController.getGeneralMetrics(businessId, startDate, endDate);
    const financialMetrics = await SupplierDashboardController.getFinancialMetrics(businessId, startDate, endDate);
    const performanceMetrics = await SupplierDashboardController.getPerformanceMetrics(businessId, startDate, endDate);
    const topSuppliers = await SupplierDashboardController.getTopSuppliers(businessId, startDate, endDate);
    const riskAnalysis = await SupplierDashboardController.getRiskAnalysis(businessId);
    const trends = await SupplierDashboardController.getTrends(businessId, startDate, endDate);
    const alerts = await SupplierDashboardController.getAlerts(businessId);
    const recommendations = await SupplierDashboardController.getRecommendations(businessId);

    return {
      businessId,
      period: {
        startDate,
        endDate,
        type: periodType
      },
      generalMetrics,
      financialMetrics,
      performanceMetrics,
      topSuppliers,
      riskAnalysis,
      trends,
      alerts,
      recommendations,
      generatedBy
    };
  }

  private static async getSupplierDetailedData(
    businessId: string,
    supplierId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Obtener resumen de cuentas por pagar
    const accountsSummary = await AccountsPayable.getSupplierSummary(businessId, supplierId);
    
    // Obtener resumen de órdenes de compra
    const ordersSummary = await PurchaseOrder.getSupplierSummary(businessId, supplierId);
    
    // Obtener productos del proveedor
    const products = await Product.find({
      businessId,
      'suppliers.supplierId': supplierId,
      isActive: true
    }).select('name sku category suppliers.$');

    return {
      accountsPayable: accountsSummary[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        overdueAmount: 0
      },
      purchaseOrders: ordersSummary[0] || {
        totalOrders: 0,
        totalAmount: 0,
        completedOrders: 0,
        pendingOrders: 0
      },
      products: products.map(product => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        supplierInfo: product.suppliers.find(s => s.supplierId.toString() === supplierId)
      }))
    };
  }
}
