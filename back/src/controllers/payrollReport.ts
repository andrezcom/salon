import { Request, Response } from 'express';
import PayrollReport, { IPayrollReport } from '../models/payrollReport';
import Payroll from '../models/payroll';
import Person from '../models/person';
import AttendanceRecord from '../models/attendance';
import AbsenceRequest from '../models/absence';
import { PayrollAutomationService } from '../services/payrollAutomation';

export class PayrollReportController {

  /**
   * Generar reporte de nómina por período
   */
  static async generatePeriodReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        periodType = 'monthly',
        filters = {}
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;
      const generatedBy = req.user?.id;

      if (!businessId || !generatedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y generatedBy son requeridos'
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

      // Obtener nóminas del período
      const payrolls = await Payroll.find({
        businessId,
        'period.startDate': { $gte: start },
        'period.endDate': { $lte: end },
        status: { $in: ['approved', 'paid'] }
      }).populate('employeeId', 'firstName lastName userInfo.department userInfo.position');

      if (payrolls.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No se encontraron nóminas para el período especificado'
        });
        return;
      }

      // Aplicar filtros
      let filteredPayrolls = payrolls;
      
      if (filters.departments && filters.departments.length > 0) {
        filteredPayrolls = filteredPayrolls.filter(p => 
          p.employeeId && 
          (p.employeeId as any).userInfo?.department && 
          filters.departments.includes((p.employeeId as any).userInfo.department)
        );
      }

      if (filters.positions && filters.positions.length > 0) {
        filteredPayrolls = filteredPayrolls.filter(p => 
          p.employeeId && 
          (p.employeeId as any).userInfo?.position && 
          filters.positions.includes((p.employeeId as any).userInfo.position)
        );
      }

      if (filters.salaryRange) {
        filteredPayrolls = filteredPayrolls.filter(p => 
          p.calculation.baseSalary >= filters.salaryRange.min && 
          p.calculation.baseSalary <= filters.salaryRange.max
        );
      }

      // Calcular resumen
      const summary = {
        totalEmployees: filteredPayrolls.length,
        totalGrossPay: filteredPayrolls.reduce((sum, p) => sum + p.calculation.totalEarnings, 0),
        totalDeductions: filteredPayrolls.reduce((sum, p) => sum + p.calculation.deductions, 0),
        totalNetPay: filteredPayrolls.reduce((sum, p) => sum + p.calculation.netPay, 0),
        totalBenefits: filteredPayrolls.reduce((sum, p) => sum + (p.calculation.transportSubsidy || 0), 0),
        averageSalary: 0,
        totalOvertime: filteredPayrolls.reduce((sum, p) => sum + (p.calculation.overtimeSubsidy || 0), 0),
        totalAbsences: 0 // Se calcularía con datos de asistencia
      };

      if (summary.totalEmployees > 0) {
        summary.averageSalary = summary.totalGrossPay / summary.totalEmployees;
      }

      // Crear datos de empleados para el reporte
      const employees = filteredPayrolls.map(payroll => ({
        employeeId: payroll.employeeId.toString(),
        employeeName: payroll.employeeId ? 
          `${(payroll.employeeId as any).firstName} ${(payroll.employeeId as any).lastName}` : 
          'Empleado no encontrado',
        department: payroll.employeeId ? (payroll.employeeId as any).userInfo?.department : '',
        position: payroll.employeeId ? (payroll.employeeId as any).userInfo?.position : '',
        grossPay: payroll.calculation.totalEarnings,
        deductions: payroll.calculation.deductions,
        netPay: payroll.calculation.netPay,
        benefits: payroll.calculation.transportSubsidy || 0,
        overtime: payroll.calculation.overtimeSubsidy || 0,
        absences: 0, // Se calcularía con datos de asistencia
        workingDays: payroll.period.workingDays,
        totalHours: payroll.period.totalHours
      }));

      // Crear reporte
      const report = new PayrollReport({
        businessId,
        reportType: 'period',
        period: {
          startDate: start,
          endDate: end,
          periodType,
          year: start.getFullYear(),
          month: start.getMonth() + 1
        },
        summary,
        employees,
        filters,
        generatedBy,
        status: 'generated'
      });

      await report.save();

      res.status(201).json({
        success: true,
        message: 'Reporte generado exitosamente',
        data: report
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
   * Obtener todos los reportes
   */
  static async getReports(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;
      const { page = 1, limit = 10, reportType, year } = req.query;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const query: any = { businessId };
      
      if (reportType) {
        query.reportType = reportType;
      }
      
      if (year) {
        query['period.year'] = parseInt(year as string);
      }

      const reports = await PayrollReport.find(query)
        .sort({ generatedAt: -1 })
        .limit(limit as number * 1)
        .skip((page as number - 1) * (limit as number))
        .populate('generatedBy', 'firstName lastName');

      const total = await PayrollReport.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Reportes obtenidos exitosamente',
        data: {
          reports,
          pagination: {
            current: page,
            pages: Math.ceil(total / (limit as number)),
            total
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

  /**
   * Obtener reporte por ID
   */
  static async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const report = await PayrollReport.findOne({ _id: id, businessId })
        .populate('generatedBy', 'firstName lastName');

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Reporte obtenido exitosamente',
        data: report
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
      const { id } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;
      const exportedBy = req.user?.id;

      if (!businessId || !exportedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y exportedBy son requeridos'
        });
        return;
      }

      const report = await PayrollReport.findOne({ _id: id, businessId });

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
        return;
      }

      // Aquí se implementaría la generación del PDF usando librerías como puppeteer o jsPDF
      // Por ahora, simulamos la exportación
      const filename = `reporte_nomina_${report.period.startDate.toISOString().split('T')[0]}_${report.period.endDate.toISOString().split('T')[0]}.pdf`;
      
      // Actualizar historial de exportación
      report.exportHistory = report.exportHistory || [];
      report.exportHistory.push({
        format: 'pdf',
        exportedAt: new Date(),
        exportedBy,
        filename
      });

      await report.save();

      res.status(200).json({
        success: true,
        message: 'Reporte exportado a PDF exitosamente',
        data: {
          filename,
          downloadUrl: `/api/reports/${id}/download/pdf`,
          reportId: report._id
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
   * Exportar reporte a Excel
   */
  static async exportToExcel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;
      const exportedBy = req.user?.id;

      if (!businessId || !exportedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y exportedBy son requeridos'
        });
        return;
      }

      const report = await PayrollReport.findOne({ _id: id, businessId });

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
        return;
      }

      // Aquí se implementaría la generación del Excel usando librerías como exceljs
      // Por ahora, simulamos la exportación
      const filename = `reporte_nomina_${report.period.startDate.toISOString().split('T')[0]}_${report.period.endDate.toISOString().split('T')[0]}.xlsx`;
      
      // Actualizar historial de exportación
      report.exportHistory = report.exportHistory || [];
      report.exportHistory.push({
        format: 'excel',
        exportedAt: new Date(),
        exportedBy,
        filename
      });

      await report.save();

      res.status(200).json({
        success: true,
        message: 'Reporte exportado a Excel exitosamente',
        data: {
          filename,
          downloadUrl: `/api/reports/${id}/download/excel`,
          reportId: report._id
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
   * Obtener estadísticas de nómina
   */
  static async getPayrollStatistics(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;
      const { year = new Date().getFullYear() } = req.query;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const startYear = new Date(parseInt(year as string), 0, 1);
      const endYear = new Date(parseInt(year as string), 11, 31);

      // Estadísticas por mes
      const monthlyStats = await Payroll.aggregate([
        {
          $match: {
            businessId,
            'period.startDate': { $gte: startYear, $lte: endYear },
            status: { $in: ['approved', 'paid'] }
          }
        },
        {
          $group: {
            _id: { $month: '$period.startDate' },
            totalEmployees: { $sum: 1 },
            totalGrossPay: { $sum: '$calculation.totalEarnings' },
            totalNetPay: { $sum: '$calculation.netPay' },
            totalDeductions: { $sum: '$calculation.deductions' },
            averageSalary: { $avg: '$calculation.totalEarnings' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Estadísticas por departamento
      const departmentStats = await Payroll.aggregate([
        {
          $match: {
            businessId,
            'period.startDate': { $gte: startYear, $lte: endYear },
            status: { $in: ['approved', 'paid'] }
          }
        },
        {
          $lookup: {
            from: 'people',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        {
          $unwind: '$employee'
        },
        {
          $group: {
            _id: '$employee.userInfo.department',
            totalEmployees: { $sum: 1 },
            totalGrossPay: { $sum: '$calculation.totalEarnings' },
            totalNetPay: { $sum: '$calculation.netPay' },
            averageSalary: { $avg: '$calculation.totalEarnings' }
          }
        },
        {
          $sort: { totalGrossPay: -1 }
        }
      ]);

      // Estadísticas generales del año
      const yearStats = await Payroll.aggregate([
        {
          $match: {
            businessId,
            'period.startDate': { $gte: startYear, $lte: endYear },
            status: { $in: ['approved', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalPayrolls: { $sum: 1 },
            totalGrossPay: { $sum: '$calculation.totalEarnings' },
            totalNetPay: { $sum: '$calculation.netPay' },
            totalDeductions: { $sum: '$calculation.deductions' },
            averageSalary: { $avg: '$calculation.totalEarnings' },
            maxSalary: { $max: '$calculation.totalEarnings' },
            minSalary: { $min: '$calculation.totalEarnings' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          year: parseInt(year as string),
          monthly: monthlyStats,
          byDepartment: departmentStats,
          summary: yearStats[0] || {
            totalPayrolls: 0,
            totalGrossPay: 0,
            totalNetPay: 0,
            totalDeductions: 0,
            averageSalary: 0,
            maxSalary: 0,
            minSalary: 0
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

  /**
   * Eliminar reporte
   */
  static async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const report = await PayrollReport.findOneAndDelete({ _id: id, businessId });

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Reporte eliminado exitosamente'
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
