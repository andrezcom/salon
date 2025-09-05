import { Request, Response } from 'express';
import Payroll, { IPayroll, IPayrollItem, IPayrollPeriod } from '../models/payroll';
import Person from '../models/person';
import CashBalance from '../models/cashBalance';
import CashTransaction from '../models/cashTransaction';

export class PayrollController {
  
  // Crear nueva nómina
  static async createPayroll(req: Request, res: Response): Promise<void> {
    try {
      const {
        employeeId,
        period,
        items = [],
        paymentMethod,
        notes
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      // Validar que el empleado existe y es del tipo correcto
      const employee = await Person.findOne({
        _id: employeeId,
        personType: 'user',
        active: true
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Empleado no encontrado o no está activo'
        });
        return;
      }

      // Validar configuración salarial
      if (!employee.userInfo?.salarySettings) {
        res.status(400).json({
          success: false,
          message: 'El empleado no tiene configuración salarial'
        });
        return;
      }

      // Crear la nómina
      const payroll = new Payroll({
        employeeId,
        businessId,
        period,
        items,
        paymentMethod,
        notes,
        createdBy,
        calculation: {
          baseSalary: 0,
          bonuses: 0,
          transportSubsidy: 0,
          overtimeSubsidy: 0,
          totalEarnings: 0,
          deductions: 0,
          netPay: 0
        }
      });

      // Calcular nómina automáticamente
      await payroll.calculatePayroll();
      await payroll.save();

      // Obtener nómina con información del empleado
      const createdPayroll = await Payroll.findById(payroll._id)
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department userInfo.salarySettings')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Nómina creada exitosamente',
        data: createdPayroll
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener todas las nóminas
  static async getPayrolls(req: Request, res: Response): Promise<void> {
    try {
      const {
        businessId,
        employeeId,
        status,
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
      
      if (employeeId) {
        filters.employeeId = employeeId;
      }
      
      if (status) {
        filters.status = status;
      }
      
      if (startDate || endDate) {
        filters['period.startDate'] = {};
        if (startDate) filters['period.startDate'].$gte = new Date(startDate as string);
        if (endDate) filters['period.startDate'].$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const payrolls = await Payroll.find(filters)
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('paidBy', 'firstName lastName')
        .sort({ 'period.startDate': -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Payroll.countDocuments(filters);

      res.status(200).json({
        success: true,
        message: 'Nóminas obtenidas exitosamente',
        data: {
          payrolls,
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

  // Obtener nómina por ID
  static async getPayrollById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const payroll = await Payroll.findOne({ _id: id, businessId })
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department userInfo.salarySettings')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('paidBy', 'firstName lastName');

      if (!payroll) {
        res.status(404).json({
          success: false,
          message: 'Nómina no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Nómina obtenida exitosamente',
        data: payroll
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar nómina
  static async updatePayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { period, items, paymentMethod, notes } = req.body;
      const businessId = req.user?.businessId;
      const updatedBy = req.user?.id;

      const payroll = await Payroll.findOne({ _id: id, businessId });

      if (!payroll) {
        res.status(404).json({
          success: false,
          message: 'Nómina no encontrada'
        });
        return;
      }

      if (payroll.status === 'paid') {
        res.status(400).json({
          success: false,
          message: 'No se puede modificar una nómina ya pagada'
        });
        return;
      }

      // Actualizar campos
      if (period) payroll.period = period;
      if (items) payroll.items = items;
      if (paymentMethod) payroll.paymentMethod = paymentMethod;
      if (notes) payroll.notes = notes;
      
      payroll.updatedBy = updatedBy;
      payroll.updatedAt = new Date();

      // Recalcular si se modificaron items o período
      if (items || period) {
        await payroll.calculatePayroll();
      }

      await payroll.save();

      // Obtener nómina actualizada
      const updatedPayroll = await Payroll.findById(payroll._id)
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Nómina actualizada exitosamente',
        data: updatedPayroll
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aprobar nómina
  static async approvePayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;
      const approvedBy = req.user?.id;

      const payroll = await Payroll.findOne({ _id: id, businessId });

      if (!payroll) {
        res.status(404).json({
          success: false,
          message: 'Nómina no encontrada'
        });
        return;
      }

      payroll.approve(approvedBy);
      await payroll.save();

      // Obtener nómina actualizada
      const approvedPayroll = await Payroll.findById(payroll._id)
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department')
        .populate('approvedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Nómina aprobada exitosamente',
        data: approvedPayroll
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Pagar nómina
  static async payPayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentReference } = req.body;
      const businessId = req.user?.businessId;
      const paidBy = req.user?.id;

      const payroll = await Payroll.findOne({ _id: id, businessId });

      if (!payroll) {
        res.status(404).json({
          success: false,
          message: 'Nómina no encontrada'
        });
        return;
      }

      if (payroll.status !== 'approved') {
        res.status(400).json({
          success: false,
          message: 'Solo se pueden pagar nóminas aprobadas'
        });
        return;
      }

      // Verificar balance de caja si el pago es en efectivo
      if (payroll.paymentMethod === 'cash') {
        const cashBalance = await CashBalance.findOne({
          businessId,
          status: 'open'
        });

        if (!cashBalance) {
          res.status(400).json({
            success: false,
            message: 'No hay balance de caja abierto'
          });
          return;
        }

        if (cashBalance.currentBalance < payroll.calculation.netPay) {
          res.status(400).json({
            success: false,
            message: 'Saldo insuficiente en caja para realizar el pago'
          });
          return;
        }
      }

      // Marcar como pagada
      payroll.markAsPaid(paidBy, paymentReference);
      await payroll.save();

      // Crear transacción de caja si es pago en efectivo
      if (payroll.paymentMethod === 'cash') {
        const cashTransaction = new CashTransaction({
          businessId,
          type: 'payroll_payment',
          amount: payroll.calculation.netPay,
          description: `Pago de nómina - ${payroll.employeeId}`,
          paymentMethod: 'cash',
          reference: paymentReference || `PAYROLL-${payroll._id}`,
          createdBy: paidBy
        });

        await cashTransaction.save();
      }

      // Obtener nómina actualizada
      const paidPayroll = await Payroll.findById(payroll._id)
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department')
        .populate('paidBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Nómina pagada exitosamente',
        data: paidPayroll
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Cancelar nómina
  static async cancelPayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const businessId = req.user?.businessId;

      const payroll = await Payroll.findOne({ _id: id, businessId });

      if (!payroll) {
        res.status(404).json({
          success: false,
          message: 'Nómina no encontrada'
        });
        return;
      }

      payroll.cancel(reason);
      await payroll.save();

      res.status(200).json({
        success: true,
        message: 'Nómina cancelada exitosamente',
        data: payroll
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen de nómina por período
  static async getPayrollSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const businessId = req.user?.businessId;

      if (!businessId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'BusinessId, startDate y endDate son requeridos'
        });
        return;
      }

      const summary = await Payroll.getPayrollSummary(
        businessId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json({
        success: true,
        message: 'Resumen de nómina obtenido exitosamente',
        data: summary[0] || {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          totalTaxWithholding: 0,
          totalSocialSecurity: 0,
          totalHealthInsurance: 0,
          totalBonuses: 0,
          totalTransportSubsidy: 0,
          totalOvertimeSubsidy: 0
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

  // Obtener empleados elegibles para nómina
  static async getEligibleEmployees(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const employees = await Person.find({
        personType: 'user',
        active: true,
        'userInfo.salarySettings': { $exists: true }
      }).select('firstName lastName userInfo.position userInfo.department userInfo.salarySettings');

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

  // Recalcular nómina
  static async recalculatePayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const payroll = await Payroll.findOne({ _id: id, businessId });

      if (!payroll) {
        res.status(404).json({
          success: false,
          message: 'Nómina no encontrada'
        });
        return;
      }

      if (payroll.status === 'paid') {
        res.status(400).json({
          success: false,
          message: 'No se puede recalcular una nómina ya pagada'
        });
        return;
      }

      // Recalcular nómina
      await payroll.calculatePayroll();
      await payroll.save();

      // Obtener nómina recalculada
      const recalculatedPayroll = await Payroll.findById(payroll._id)
        .populate('employeeId', 'firstName lastName userInfo.position userInfo.department userInfo.salarySettings');

      res.status(200).json({
        success: true,
        message: 'Nómina recalculada exitosamente',
        data: recalculatedPayroll
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
