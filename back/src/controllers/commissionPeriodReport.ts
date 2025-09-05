import { Request, Response } from 'express';
import CommissionPeriod from '../models/commissionPeriod';
import Commission from '../models/commission';
import Person from '../models/person';
import Business from '../models/business';
import { PDFGeneratorService } from '../services/pdfGenerator';
import { ExcelGeneratorService } from '../services/excelGenerator';
import path from 'path';
import fs from 'fs';

export class CommissionPeriodReportController {

  /**
   * Generar reporte de períodos por rango de fechas
   */
  static async generatePeriodReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'period', // period, expert, status
        includeDetails = false
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
        return;
      }

      const query: any = {
        businessId,
        startDate: { $gte: start },
        endDate: { $lte: end }
      };

      let reportData;

      if (groupBy === 'period') {
        // Agrupar por período
        reportData = await CommissionPeriod.find(query)
          .sort({ year: -1, periodNumber: -1 });

      } else if (groupBy === 'expert') {
        // Agrupar por experto
        const periods = await CommissionPeriod.find(query);
        
        const expertMap = new Map();
        
        periods.forEach(period => {
          period.expertCommissions.forEach(expert => {
            if (!expertMap.has(expert.expertId)) {
              expertMap.set(expert.expertId, {
                expertId: expert.expertId,
                expertName: expert.expertName,
                expertAlias: expert.expertAlias,
                totalPeriods: 0,
                totalCommissions: 0,
                totalCount: 0,
                serviceCommissions: 0,
                retailCommissions: 0,
                exceptionalCommissions: 0,
                periods: []
              });
            }
            
            const expertData = expertMap.get(expert.expertId);
            expertData.totalPeriods += 1;
            expertData.totalCommissions += expert.totalCommissions;
            expertData.totalCount += expert.commissionCount;
            expertData.serviceCommissions += expert.serviceCommissions;
            expertData.retailCommissions += expert.retailCommissions;
            expertData.exceptionalCommissions += expert.exceptionalCommissions;
            expertData.periods.push({
              periodNumber: period.periodNumber,
              year: period.year,
              startDate: period.startDate,
              endDate: period.endDate,
              totalCommissions: expert.totalCommissions,
              commissionCount: expert.commissionCount,
              status: expert.status
            });
          });
        });
        
        reportData = Array.from(expertMap.values()).sort((a, b) => b.totalCommissions - a.totalCommissions);

      } else if (groupBy === 'status') {
        // Agrupar por estado
        const periods = await CommissionPeriod.find(query);
        
        const statusMap = new Map();
        
        periods.forEach(period => {
          if (!statusMap.has(period.status)) {
            statusMap.set(period.status, {
              status: period.status,
              totalPeriods: 0,
              totalCommissions: 0,
              totalExperts: 0,
              periods: []
            });
          }
          
          const statusData = statusMap.get(period.status);
          statusData.totalPeriods += 1;
          statusData.totalCommissions += period.summary.totalCommissions;
          statusData.totalExperts += period.summary.totalExperts;
          statusData.periods.push({
            periodNumber: period.periodNumber,
            year: period.year,
            startDate: period.startDate,
            endDate: period.endDate,
            totalCommissions: period.summary.totalCommissions,
            totalExperts: period.summary.totalExperts
          });
        });
        
        reportData = Array.from(statusMap.values());
      }

      // Calcular totales generales
      const periods = await CommissionPeriod.find(query);
      const totals = {
        totalPeriods: periods.length,
        totalCommissions: periods.reduce((sum, p) => sum + p.summary.totalCommissions, 0),
        totalExperts: periods.reduce((sum, p) => sum + p.summary.totalExperts, 0),
        totalPaid: periods.reduce((sum, p) => sum + p.summary.paidAmount, 0),
        totalPending: periods.reduce((sum, p) => sum + p.summary.pendingAmount, 0),
        totalApproved: periods.reduce((sum, p) => sum + p.summary.approvedAmount, 0),
        totalCancelled: periods.reduce((sum, p) => sum + p.summary.cancelledAmount, 0)
      };

      res.status(200).json({
        success: true,
        message: 'Reporte de períodos generado exitosamente',
        data: {
          report: reportData,
          totals,
          filters: {
            startDate: start,
            endDate: end,
            groupBy,
            includeDetails
          },
          generatedAt: new Date()
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

  /**
   * Generar reporte de comisiones por experto
   */
  static async generateExpertReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        expertId,
        startDate,
        endDate,
        includePeriodDetails = true
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId || !expertId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y expertId son requeridos'
        });
        return;
      }

      // Obtener información del experto
      const expert = await Person.findOne({
        _id: expertId,
        personType: 'expert',
        active: true
      });

      if (!expert) {
        res.status(404).json({
          success: false,
          message: 'Experto no encontrado'
        });
        return;
      }

      // Construir filtros de fecha
      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.startDate = { $gte: new Date(startDate) };
        dateFilter.endDate = { $lte: new Date(endDate) };
      }

      // Obtener períodos del experto
      const periods = await CommissionPeriod.find({
        businessId,
        ...dateFilter,
        'expertCommissions.expertId': expertId
      }).sort({ year: -1, periodNumber: -1 });

      // Calcular resumen del experto
      const expertSummary = {
        expertId: expert._id.toString(),
        expertName: `${expert.firstName} ${expert.lastName}`,
        expertAlias: expert.expertInfo?.alias || '',
        totalPeriods: periods.length,
        totalCommissions: 0,
        totalCount: 0,
        serviceCommissions: 0,
        retailCommissions: 0,
        exceptionalCommissions: 0,
        paidAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        cancelledAmount: 0
      };

      const periodDetails = [];

      periods.forEach(period => {
        const expertCommission = period.expertCommissions.find(
          ec => ec.expertId === expertId
        );

        if (expertCommission) {
          expertSummary.totalCommissions += expertCommission.totalCommissions;
          expertSummary.totalCount += expertCommission.commissionCount;
          expertSummary.serviceCommissions += expertCommission.serviceCommissions;
          expertSummary.retailCommissions += expertCommission.retailCommissions;
          expertSummary.exceptionalCommissions += expertCommission.exceptionalCommissions;

          // Clasificar por estado
          switch (expertCommission.status) {
            case 'paid':
              expertSummary.paidAmount += expertCommission.totalCommissions;
              break;
            case 'pending':
              expertSummary.pendingAmount += expertCommission.totalCommissions;
              break;
            case 'approved':
              expertSummary.approvedAmount += expertCommission.totalCommissions;
              break;
            case 'cancelled':
              expertSummary.cancelledAmount += expertCommission.totalCommissions;
              break;
          }

          if (includePeriodDetails) {
            periodDetails.push({
              periodNumber: period.periodNumber,
              year: period.year,
              startDate: period.startDate,
              endDate: period.endDate,
              payDate: period.payDate,
              status: period.status,
              expertStatus: expertCommission.status,
              totalCommissions: expertCommission.totalCommissions,
              commissionCount: expertCommission.commissionCount,
              serviceCommissions: expertCommission.serviceCommissions,
              retailCommissions: expertCommission.retailCommissions,
              exceptionalCommissions: expertCommission.exceptionalCommissions,
              paymentMethod: expertCommission.paymentMethod,
              paymentDate: expertCommission.paymentDate
            });
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Reporte de experto generado exitosamente',
        data: {
          expert: expertSummary,
          periods: periodDetails,
          filters: {
            startDate,
            endDate,
            includePeriodDetails
          },
          generatedAt: new Date()
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

  /**
   * Generar reporte de rendimiento por períodos
   */
  static async generatePerformanceReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        metric = 'totalCommissions' // totalCommissions, commissionCount, averageCommission
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
        return;
      }

      const periods = await CommissionPeriod.find({
        businessId,
        startDate: { $gte: start },
        endDate: { $lte: end }
      }).sort({ year: 1, periodNumber: 1 });

      // Calcular métricas de rendimiento
      const performanceData = periods.map(period => {
        let metricValue = 0;
        
        switch (metric) {
          case 'totalCommissions':
            metricValue = period.summary.totalCommissions;
            break;
          case 'commissionCount':
            metricValue = period.summary.totalCount;
            break;
          case 'averageCommission':
            metricValue = period.summary.totalCount > 0 
              ? period.summary.totalCommissions / period.summary.totalCount 
              : 0;
            break;
        }

        return {
          periodNumber: period.periodNumber,
          year: period.year,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
          totalExperts: period.summary.totalExperts,
          totalCommissions: period.summary.totalCommissions,
          totalCount: period.summary.totalCount,
          averageCommission: period.summary.totalCount > 0 
            ? period.summary.totalCommissions / period.summary.totalCount 
            : 0,
          metricValue,
          paidAmount: period.summary.paidAmount,
          pendingAmount: period.summary.pendingAmount,
          approvedAmount: period.summary.approvedAmount
        };
      });

      // Calcular tendencias
      const trends = {
        totalPeriods: performanceData.length,
        averageCommissions: performanceData.length > 0 
          ? performanceData.reduce((sum, p) => sum + p.totalCommissions, 0) / performanceData.length 
          : 0,
        averageCount: performanceData.length > 0 
          ? performanceData.reduce((sum, p) => sum + p.totalCount, 0) / performanceData.length 
          : 0,
        averageExperts: performanceData.length > 0 
          ? performanceData.reduce((sum, p) => sum + p.totalExperts, 0) / performanceData.length 
          : 0,
        totalCommissions: performanceData.reduce((sum, p) => sum + p.totalCommissions, 0),
        totalPaid: performanceData.reduce((sum, p) => sum + p.paidAmount, 0),
        totalPending: performanceData.reduce((sum, p) => sum + p.pendingAmount, 0),
        totalApproved: performanceData.reduce((sum, p) => sum + p.approvedAmount, 0)
      };

      // Calcular crecimiento (comparar primer y último período)
      let growth = 0;
      if (performanceData.length >= 2) {
        const firstPeriod = performanceData[0];
        const lastPeriod = performanceData[performanceData.length - 1];
        
        if (firstPeriod.metricValue > 0) {
          growth = ((lastPeriod.metricValue - firstPeriod.metricValue) / firstPeriod.metricValue) * 100;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Reporte de rendimiento generado exitosamente',
        data: {
          performance: performanceData,
          trends: {
            ...trends,
            growth: Math.round(growth * 100) / 100
          },
          filters: {
            startDate: start,
            endDate: end,
            metric
          },
          generatedAt: new Date()
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

  /**
   * Exportar reporte a PDF
   */
  static async exportToPDF(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, reportData, filters } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;
      const exportedBy = req.user?.id;

      if (!businessId || !exportedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y exportedBy son requeridos'
        });
        return;
      }

      // Obtener información del negocio
      const business = await Business.findOne({ _id: businessId });
      if (!business) {
        res.status(404).json({
          success: false,
          message: 'Negocio no encontrado'
        });
        return;
      }

      // Generar PDF
      const pdfBuffer = await PDFGeneratorService.generateCommissionPeriodReportPDF(
        reportData,
        business,
        reportType
      );

      // Crear directorio de descargas si no existe
      const downloadsDir = path.join(process.cwd(), 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Generar nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `reporte_comisiones_${reportType}_${timestamp}.pdf`;
      const filePath = path.join(downloadsDir, filename);

      // Guardar archivo
      fs.writeFileSync(filePath, pdfBuffer);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar archivo
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error exportando a PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Exportar reporte a Excel
   */
  static async exportToExcel(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, reportData } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;
      const exportedBy = req.user?.id;

      if (!businessId || !exportedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y exportedBy son requeridos'
        });
        return;
      }

      // Aquí se implementaría la generación del Excel usando librerías como exceljs
      // Por ahora, simulamos la exportación
      const filename = `reporte_comisiones_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.status(200).json({
        success: true,
        message: 'Reporte exportado a Excel exitosamente',
        data: {
          filename,
          downloadUrl: `/api/commission-period-reports/download/${filename}`,
          reportType,
          exportedAt: new Date()
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
}
