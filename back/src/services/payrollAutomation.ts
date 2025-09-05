import Payroll, { IPayroll } from '../models/payroll';
import Person from '../models/person';
import AttendanceRecord, { AttendanceSummary } from '../models/attendance';
import AbsenceRequest from '../models/absence';
import EmployeeBenefit from '../models/benefits';
import PayrollTemplate from '../models/payrollTemplate';
import PayrollConfiguration from '../models/payrollConfiguration';
import PayrollSchedule from '../models/payrollSchedule';
import CashBalance from '../models/cashBalance';
import CashTransaction from '../models/cashTransaction';

export class PayrollAutomationService {
  
  /**
   * Genera nóminas automáticamente para un período específico
   */
  static async generatePayrollsForPeriod(
    businessId: string,
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      generatedCount: number;
      totalAmount: number;
      errors: string[];
      payrolls: IPayroll[];
    };
  }> {
    try {
      const errors: string[] = [];
      const generatedPayrolls: IPayroll[] = [];
      let totalAmount = 0;

      // Obtener empleados elegibles
      const employees = await Person.find({
        businessId,
        personType: 'user',
        active: true,
        'userInfo.salarySettings': { $exists: true }
      });

      if (employees.length === 0) {
        return {
          success: false,
          message: 'No se encontraron empleados elegibles para nómina',
          data: {
            generatedCount: 0,
            totalAmount: 0,
            errors: ['No hay empleados con configuración salarial'],
            payrolls: []
          }
        };
      }

      // Obtener configuración de nómina
      const configuration = await PayrollConfiguration.findOne({
        businessId,
        isActive: true
      });

      if (!configuration) {
        return {
          success: false,
          message: 'No se encontró configuración de nómina activa',
          data: {
            generatedCount: 0,
            totalAmount: 0,
            errors: ['Configuración de nómina no encontrada'],
            payrolls: []
          }
        };
      }

      // Procesar cada empleado
      for (const employee of employees) {
        try {
          const payroll = await this.generateEmployeePayroll(
            businessId,
            employee._id.toString(),
            periodStart,
            periodEnd,
            configuration,
            generatedBy
          );

          if (payroll) {
            generatedPayrolls.push(payroll);
            totalAmount += payroll.calculation.netPay;
          }
        } catch (error) {
          errors.push(`Error procesando empleado ${employee.firstName} ${employee.lastName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      return {
        success: true,
        message: `Nóminas generadas exitosamente para ${generatedPayrolls.length} empleados`,
        data: {
          generatedCount: generatedPayrolls.length,
          totalAmount,
          errors,
          payrolls: generatedPayrolls
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error en la generación automática de nóminas',
        data: {
          generatedCount: 0,
          totalAmount: 0,
          errors: [error instanceof Error ? error.message : 'Error desconocido'],
          payrolls: []
        }
      };
    }
  }

  /**
   * Genera nómina para un empleado específico
   */
  static async generateEmployeePayroll(
    businessId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    configuration: any,
    generatedBy: string
  ): Promise<IPayroll | null> {
    try {
      // Verificar si ya existe nómina para este período
      const existingPayroll = await Payroll.findOne({
        businessId,
        employeeId,
        'period.startDate': periodStart,
        'period.endDate': periodEnd
      });

      if (existingPayroll) {
        throw new Error('Ya existe una nómina para este empleado en este período');
      }

      // Obtener datos del empleado
      const employee = await Person.findById(employeeId);
      if (!employee || !employee.userInfo?.salarySettings) {
        throw new Error('Empleado no encontrado o sin configuración salarial');
      }

      // Obtener plantilla aplicable
      const template = await PayrollTemplate.getApplicableTemplates(businessId, {
        personType: employee.personType,
        department: employee.userInfo.department,
        position: employee.userInfo.position,
        salary: employee.userInfo.salarySettings.monthlySalary,
        tenure: this.calculateTenure(employee.createdAt)
      });

      const applicableTemplate = template[0] || await PayrollTemplate.getDefaultTemplate(businessId, 'employee');

      if (!applicableTemplate) {
        throw new Error('No se encontró plantilla aplicable para el empleado');
      }

      // Obtener datos de asistencia
      const attendanceData = await this.getAttendanceData(businessId, employeeId, periodStart, periodEnd);

      // Obtener ausencias aprobadas
      const approvedAbsences = await AbsenceRequest.find({
        businessId,
        employeeId,
        status: 'approved',
        startDate: { $lte: periodEnd },
        endDate: { $gte: periodStart }
      });

      // Obtener beneficios del empleado
      const employeeBenefits = await EmployeeBenefit.getEmployeeBenefits(businessId, employeeId);

      // Calcular nómina
      const payrollCalculation = await this.calculatePayroll(
        employee,
        applicableTemplate,
        attendanceData,
        approvedAbsences,
        employeeBenefits,
        configuration,
        periodStart,
        periodEnd
      );

      // Crear nómina
      const payroll = new Payroll({
        employeeId,
        businessId,
        period: {
          startDate: periodStart,
          endDate: periodEnd,
          periodType: configuration.settings.payrollPeriod.type,
          workingDays: attendanceData.workingDays,
          totalHours: attendanceData.totalHours,
          overtimeHours: attendanceData.overtimeHours
        },
        items: payrollCalculation.items,
        calculation: payrollCalculation.calculation,
        status: 'draft',
        paymentMethod: 'transfer', // Por defecto
        createdBy: generatedBy
      });

      await payroll.save();

      return payroll;

    } catch (error) {
      console.error(`Error generando nómina para empleado ${employeeId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene datos de asistencia para un período
   */
  static async getAttendanceData(
    businessId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    workingDays: number;
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    absentDays: number;
    lateDays: number;
  }> {
    try {
      const attendanceRecords = await AttendanceRecord.getEmployeeAttendance(
        businessId,
        employeeId,
        periodStart,
        periodEnd
      );

      const workingDays = attendanceRecords.filter(r => r.status === 'present').length;
      const totalHours = attendanceRecords.reduce((sum, r) => sum + r.totalHours, 0);
      const regularHours = attendanceRecords.reduce((sum, r) => sum + r.regularHours, 0);
      const overtimeHours = attendanceRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
      const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateDays = attendanceRecords.filter(r => r.status === 'late').length;

      return {
        workingDays,
        totalHours,
        regularHours,
        overtimeHours,
        absentDays,
        lateDays
      };

    } catch (error) {
      console.error('Error obteniendo datos de asistencia:', error);
      return {
        workingDays: 0,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        absentDays: 0,
        lateDays: 0
      };
    }
  }

  /**
   * Calcula la nómina completa para un empleado
   */
  static async calculatePayroll(
    employee: any,
    template: any,
    attendanceData: any,
    approvedAbsences: any[],
    employeeBenefits: any[],
    configuration: any,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    items: any[];
    calculation: any;
  }> {
    const items: any[] = [];
    let baseSalary = 0;
    let bonuses = 0;
    let allowances = 0;
    let overtimePay = 0;
    let deductions = 0;

    // Calcular salario base
    const salarySettings = employee.userInfo.salarySettings;
    const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const workingDaysInPeriod = this.getWorkingDaysInPeriod(periodStart, periodEnd, template.template.attendance.workingDays);

    switch (salarySettings.salaryType) {
      case 'monthly':
        baseSalary = (salarySettings.monthlySalary / 30) * attendanceData.workingDays;
        break;
      case 'hourly':
        baseSalary = salarySettings.hourlyRate * attendanceData.regularHours;
        break;
      case 'daily':
        baseSalary = salarySettings.dailyRate * attendanceData.workingDays;
        break;
    }

    items.push({
      type: 'salary',
      description: 'Salario base',
      amount: baseSalary,
      taxable: true,
      category: 'earnings'
    });

    // Calcular horas extras
    if (attendanceData.overtimeHours > 0 && template.template.overtime.enabled) {
      const overtimeRate = template.template.overtime.rate;
      const hourlyRate = salarySettings.salaryType === 'hourly' 
        ? salarySettings.hourlyRate 
        : (salarySettings.monthlySalary / (30 * 8)); // Asumiendo 8 horas por día

      overtimePay = attendanceData.overtimeHours * hourlyRate * overtimeRate;
      
      items.push({
        type: 'overtime_subsidy',
        description: 'Horas extras',
        amount: overtimePay,
        taxable: true,
        category: 'earnings'
      });
    }

    // Calcular subsidio de transporte
    if (salarySettings.transportSubsidy > 0) {
      allowances += salarySettings.transportSubsidy;
      items.push({
        type: 'transport_subsidy',
        description: 'Subsidio de transporte',
        amount: salarySettings.transportSubsidy,
        taxable: false,
        category: 'benefits'
      });
    }

    // Calcular bonificaciones
    if (template.template.salaryStructure.bonuses.length > 0) {
      for (const bonus of template.template.salaryStructure.bonuses) {
        let bonusAmount = 0;
        
        switch (bonus.type) {
          case 'fixed':
            bonusAmount = bonus.amount;
            break;
          case 'percentage':
            bonusAmount = baseSalary * (bonus.amount / 100);
            break;
          case 'performance':
            // Aquí se podría integrar con sistema de evaluación de desempeño
            bonusAmount = baseSalary * (bonus.amount / 100);
            break;
        }

        if (bonusAmount > 0) {
          bonuses += bonusAmount;
          items.push({
            type: 'bonus',
            description: bonus.name,
            amount: bonusAmount,
            taxable: true,
            category: 'earnings'
          });
        }
      }
    }

    // Calcular deducciones
    const totalEarnings = baseSalary + bonuses + overtimePay + allowances;

    // Retención de impuestos
    if (template.template.deductions.taxWithholding.enabled) {
      const taxAmount = totalEarnings * (template.template.deductions.taxWithholding.rate / 100);
      deductions += taxAmount;
      items.push({
        type: 'deduction',
        description: 'Retención de impuestos',
        amount: taxAmount,
        taxable: false,
        category: 'deductions'
      });
    }

    // Seguridad social
    if (template.template.deductions.socialSecurity.enabled) {
      const socialSecurityAmount = totalEarnings * (template.template.deductions.socialSecurity.employeeRate / 100);
      deductions += socialSecurityAmount;
      items.push({
        type: 'deduction',
        description: 'Seguridad social',
        amount: socialSecurityAmount,
        taxable: false,
        category: 'deductions'
      });
    }

    // Salud
    if (template.template.deductions.healthInsurance.enabled) {
      const healthAmount = totalEarnings * (template.template.deductions.healthInsurance.employeeRate / 100);
      deductions += healthAmount;
      items.push({
        type: 'deduction',
        description: 'Salud',
        amount: healthAmount,
        taxable: false,
        category: 'deductions'
      });
    }

    // Pensión
    if (template.template.deductions.pension.enabled) {
      const pensionAmount = totalEarnings * (template.template.deductions.pension.employeeRate / 100);
      deductions += pensionAmount;
      items.push({
        type: 'deduction',
        description: 'Pensión',
        amount: pensionAmount,
        taxable: false,
        category: 'deductions'
      });
    }

    // Otras deducciones
    if (template.template.deductions.other.length > 0) {
      for (const deduction of template.template.deductions.other) {
        let deductionAmount = 0;
        
        switch (deduction.type) {
          case 'fixed':
            deductionAmount = deduction.amount;
            break;
          case 'percentage':
            deductionAmount = totalEarnings * (deduction.amount / 100);
            break;
        }

        if (deductionAmount > 0) {
          deductions += deductionAmount;
          items.push({
            type: 'deduction',
            description: deduction.name,
            amount: deductionAmount,
            taxable: false,
            category: 'deductions'
          });
        }
      }
    }

    const calculation = {
      baseSalary,
      bonuses,
      transportSubsidy: allowances,
      overtimeSubsidy: overtimePay,
      totalEarnings,
      deductions,
      netPay: totalEarnings - deductions,
      taxWithholding: template.template.deductions.taxWithholding.enabled ? 
        totalEarnings * (template.template.deductions.taxWithholding.rate / 100) : 0,
      socialSecurity: template.template.deductions.socialSecurity.enabled ? 
        totalEarnings * (template.template.deductions.socialSecurity.employeeRate / 100) : 0,
      healthInsurance: template.template.deductions.healthInsurance.enabled ? 
        totalEarnings * (template.template.deductions.healthInsurance.employeeRate / 100) : 0
    };

    return { items, calculation };
  }

  /**
   * Calcula la antigüedad del empleado en meses
   */
  static calculateTenure(hireDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  /**
   * Obtiene los días laborales en un período
   */
  static getWorkingDaysInPeriod(startDate: Date, endDate: Date, workingDays: number[]): number {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (workingDays.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  /**
   * Procesa pagos automáticamente
   */
  static async processPayrollPayments(
    businessId: string,
    payrollIds: string[],
    paymentMethod: 'cash' | 'transfer' | 'check',
    processedBy: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      processedCount: number;
      totalAmount: number;
      errors: string[];
    };
  }> {
    try {
      const errors: string[] = [];
      let processedCount = 0;
      let totalAmount = 0;

      for (const payrollId of payrollIds) {
        try {
          const payroll = await Payroll.findById(payrollId);
          if (!payroll || payroll.businessId !== businessId) {
            errors.push(`Nómina ${payrollId} no encontrada`);
            continue;
          }

          if (payroll.status !== 'approved') {
            errors.push(`Nómina ${payrollId} no está aprobada`);
            continue;
          }

          // Procesar pago
          payroll.status = 'paid';
          payroll.paymentDate = new Date();
          payroll.paidBy = processedBy;
          payroll.paidAt = new Date();
          payroll.paymentMethod = paymentMethod;

          await payroll.save();

          // Crear transacción de caja si es pago en efectivo
          if (paymentMethod === 'cash') {
            await CashTransaction.create({
              businessId,
              type: 'payroll_payment',
              amount: -payroll.calculation.netPay,
              description: `Pago de nómina - ${payroll.employeeId}`,
              reference: payroll._id.toString(),
              processedBy
            });

            // Actualizar balance de caja
            await CashBalance.updateBalance(businessId, -payroll.calculation.netPay, 'payroll_payment');
          }

          processedCount++;
          totalAmount += payroll.calculation.netPay;

        } catch (error) {
          errors.push(`Error procesando nómina ${payrollId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      return {
        success: true,
        message: `Pagos procesados exitosamente: ${processedCount} nóminas`,
        data: {
          processedCount,
          totalAmount,
          errors
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error en el procesamiento de pagos',
        data: {
          processedCount: 0,
          totalAmount: 0,
          errors: [error instanceof Error ? error.message : 'Error desconocido']
        }
      };
    }
  }

  /**
   * Genera recordatorios automáticos
   */
  static async generateReminders(businessId: string): Promise<void> {
    try {
      // Recordatorios de fechas de pago próximas
      const upcomingPayrolls = await Payroll.find({
        businessId,
        status: 'approved',
        paymentDate: { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } // 3 días
      });

      // Recordatorios de nóminas pendientes de aprobación
      const pendingApprovals = await Payroll.find({
        businessId,
        status: 'draft',
        createdAt: { $lte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // 2 días
      });

      // Aquí se implementaría la lógica de envío de notificaciones
      // (email, SMS, push notifications, etc.)
      
      console.log(`Recordatorios generados: ${upcomingPayrolls.length} pagos próximos, ${pendingApprovals.length} aprobaciones pendientes`);

    } catch (error) {
      console.error('Error generando recordatorios:', error);
    }
  }
}
