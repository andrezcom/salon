import { Request, Response } from 'express';
import { PayrollAutomationService } from '../services/payrollAutomation';
import { PayrollConfiguration, PayrollTemplate } from '../models/payrollTemplate';
import Person from '../models/person';
import AttendanceRecord from '../models/attendance';
import AbsenceRequest from '../models/absence';

export class PayrollAutomationController {

  /**
   * Generar nóminas automáticamente para un período
   */
  static async generatePayrollsForPeriod(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        periodType = 'monthly'
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

      const result = await PayrollAutomationService.generatePayrollsForPeriod(
        businessId,
        start,
        end,
        generatedBy
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          data: result.data
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Procesar pagos de nómina automáticamente
   */
  static async processPayrollPayments(req: Request, res: Response): Promise<void> {
    try {
      const {
        payrollIds,
        paymentMethod = 'transfer'
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;
      const processedBy = req.user?.id;

      if (!businessId || !processedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y processedBy son requeridos'
        });
        return;
      }

      if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Lista de IDs de nómina es requerida'
        });
        return;
      }

      const result = await PayrollAutomationService.processPayrollPayments(
        businessId,
        payrollIds,
        paymentMethod,
        processedBy
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          data: result.data
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Generar recordatorios automáticos
   */
  static async generateReminders(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      await PayrollAutomationService.generateReminders(businessId);

      res.status(200).json({
        success: true,
        message: 'Recordatorios generados exitosamente'
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
   * Obtener empleados elegibles para nómina
   */
  static async getEligibleEmployees(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Obtener empleados con configuración salarial
      const employees = await Person.find({
        businessId,
        personType: 'user',
        active: true,
        'userInfo.salarySettings': { $exists: true }
      }).select('firstName lastName userInfo.department userInfo.position userInfo.salarySettings');

      res.status(200).json({
        success: true,
        message: 'Empleados elegibles obtenidos exitosamente',
        data: employees
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
   * Validar configuración de nómina
   */
  static async validatePayrollConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Verificar configuración de nómina
      const configuration = await PayrollConfiguration.findOne({
        businessId,
        isActive: true
      });

      // Verificar plantillas
      const templates = await PayrollTemplate.find({
        businessId,
        isActive: true
      });

      // Verificar empleados con configuración salarial
      const employeesWithSalary = await Person.countDocuments({
        businessId,
        personType: 'user',
        active: true,
        'userInfo.salarySettings': { $exists: true }
      });

      const validation = {
        hasConfiguration: !!configuration,
        hasTemplates: templates.length > 0,
        hasEmployees: employeesWithSalary > 0,
        configurationDetails: configuration ? {
          payrollPeriod: configuration.settings.payrollPeriod.type,
          currency: configuration.settings.calculation.currency,
          overtimeEnabled: configuration.settings.overtime.enabled
        } : null,
        templateCount: templates.length,
        employeeCount: employeesWithSalary,
        issues: []
      };

      if (!validation.hasConfiguration) {
        validation.issues.push('No hay configuración de nómina activa');
      }

      if (!validation.hasTemplates) {
        validation.issues.push('No hay plantillas de nómina configuradas');
      }

      if (!validation.hasEmployees) {
        validation.issues.push('No hay empleados con configuración salarial');
      }

      res.status(200).json({
        success: true,
        message: 'Validación de configuración completada',
        data: validation
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
   * Obtener estadísticas de automatización
   */
  static async getAutomationStats(req: Request, res: Response): Promise<void> {
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

      // Estadísticas de nóminas generadas automáticamente
      const autoGeneratedPayrolls = await Payroll.countDocuments({
        businessId,
        'period.startDate': { $gte: startYear, $lte: endYear },
        status: { $in: ['approved', 'paid'] }
      });

      // Estadísticas de pagos procesados
      const processedPayments = await Payroll.countDocuments({
        businessId,
        'period.startDate': { $gte: startYear, $lte: endYear },
        status: 'paid'
      });

      // Estadísticas de asistencia
      const attendanceRecords = await AttendanceRecord.countDocuments({
        businessId,
        date: { $gte: startYear, $lte: endYear }
      });

      // Estadísticas de ausencias
      const absenceRequests = await AbsenceRequest.countDocuments({
        businessId,
        startDate: { $gte: startYear, $lte: endYear }
      });

      const stats = {
        year: parseInt(year as string),
        payrolls: {
          totalGenerated: autoGeneratedPayrolls,
          totalProcessed: processedPayments,
          pendingApproval: await Payroll.countDocuments({
            businessId,
            'period.startDate': { $gte: startYear, $lte: endYear },
            status: 'draft'
          })
        },
        attendance: {
          totalRecords: attendanceRecords,
          presentDays: await AttendanceRecord.countDocuments({
            businessId,
            date: { $gte: startYear, $lte: endYear },
            status: 'present'
          }),
          absentDays: await AttendanceRecord.countDocuments({
            businessId,
            date: { $gte: startYear, $lte: endYear },
            status: 'absent'
          })
        },
        absences: {
          totalRequests: absenceRequests,
          approved: await AbsenceRequest.countDocuments({
            businessId,
            startDate: { $gte: startYear, $lte: endYear },
            status: 'approved'
          }),
          pending: await AbsenceRequest.countDocuments({
            businessId,
            startDate: { $gte: startYear, $lte: endYear },
            status: 'pending'
          })
        }
      };

      res.status(200).json({
        success: true,
        message: 'Estadísticas de automatización obtenidas exitosamente',
        data: stats
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
