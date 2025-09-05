import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el sistema de nómina
export interface IPayrollItem {
  type: 'salary' | 'bonus' | 'transport_subsidy' | 'overtime_subsidy' | 'deduction' | 'other';
  description: string;
  amount: number;
  taxable: boolean; // Si está sujeto a impuestos
  category: 'earnings' | 'deductions' | 'benefits';
}

export interface IPayrollPeriod {
  startDate: Date;
  endDate: Date;
  periodType: 'weekly' | 'biweekly' | 'monthly';
  workingDays: number;
  totalHours: number;
  overtimeHours?: number;
}

export interface IPayrollCalculation {
  baseSalary: number;
  bonuses: number;
  transportSubsidy: number;
  overtimeSubsidy: number;
  totalEarnings: number;
  deductions: number;
  netPay: number;
  taxWithholding?: number;
  socialSecurity?: number;
  healthInsurance?: number;
}

export interface IPayroll extends Document {
  _id: string;
  employeeId: string; // Referencia a Person con personType: 'user'
  businessId: string;
  period: IPayrollPeriod;
  items: IPayrollItem[];
  calculation: IPayrollCalculation;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  paymentMethod: 'cash' | 'transfer' | 'check';
  paymentDate?: Date;
  paymentReference?: string;
  notes?: string;
  approvedBy?: string; // ID del usuario que aprobó
  approvedAt?: Date;
  paidBy?: string; // ID del usuario que procesó el pago
  paidAt?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para items de nómina
const payrollItemSchema = new Schema<IPayrollItem>({
  type: {
    type: String,
    enum: ['salary', 'bonus', 'transport_subsidy', 'overtime_subsidy', 'deduction', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  taxable: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['earnings', 'deductions', 'benefits'],
    required: true
  }
}, { _id: false });

// Schema para período de nómina
const payrollPeriodSchema = new Schema<IPayrollPeriod>({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  periodType: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    required: true
  },
  workingDays: {
    type: Number,
    required: true,
    min: 0,
    max: 31
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Schema para cálculos de nómina
const payrollCalculationSchema = new Schema<IPayrollCalculation>({
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  bonuses: {
    type: Number,
    default: 0,
    min: 0
  },
  transportSubsidy: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeSubsidy: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netPay: {
    type: Number,
    required: true,
    min: 0
  },
  taxWithholding: {
    type: Number,
    default: 0,
    min: 0
  },
  socialSecurity: {
    type: Number,
    default: 0,
    min: 0
  },
  healthInsurance: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Schema principal de nómina
const payrollSchema = new Schema<IPayroll>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true,
    index: true
  },
  businessId: {
    type: String,
    required: true,
    index: true
  },
  period: {
    type: payrollPeriodSchema,
    required: true
  },
  items: [payrollItemSchema],
  calculation: {
    type: payrollCalculationSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid', 'cancelled'],
    default: 'draft',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'check'],
    required: true
  },
  paymentDate: {
    type: Date
  },
  paymentReference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  },
  approvedAt: {
    type: Date
  },
  paidBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  },
  paidAt: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  }
}, {
  timestamps: true,
  collection: 'payrolls'
});

// Índices para optimizar consultas
payrollSchema.index({ businessId: 1, employeeId: 1, 'period.startDate': -1 });
payrollSchema.index({ businessId: 1, status: 1, 'period.startDate': -1 });
payrollSchema.index({ businessId: 1, 'period.startDate': 1, 'period.endDate': 1 });

// Middleware pre-save para calcular nómina automáticamente
payrollSchema.pre('save', async function(next) {
  if (this.isModified('items') || this.isModified('period')) {
    await this.calculatePayroll();
  }
  next();
});

// Método para calcular la nómina
payrollSchema.methods.calculatePayroll = async function() {
  try {
    // Obtener información del empleado
    const Person = mongoose.model('Person');
    const employee = await Person.findById(this.employeeId);
    
    if (!employee || employee.personType !== 'user') {
      throw new Error('Empleado no encontrado o tipo incorrecto');
    }

    // Obtener configuración salarial del empleado
    const userInfo = employee.userInfo;
    if (!userInfo?.salarySettings) {
      throw new Error('Configuración salarial no encontrada');
    }

    const salarySettings = userInfo.salarySettings;
    
    // Calcular salario base
    let baseSalary = 0;
    if (salarySettings.salaryType === 'monthly') {
      baseSalary = salarySettings.monthlySalary;
    } else if (salarySettings.salaryType === 'hourly') {
      baseSalary = salarySettings.hourlyRate * this.period.totalHours;
    } else if (salarySettings.salaryType === 'daily') {
      baseSalary = salarySettings.dailyRate * this.period.workingDays;
    }

    // Calcular bonificaciones
    let bonuses = 0;
    const bonusItems = this.items.filter(item => item.type === 'bonus' && item.category === 'earnings');
    bonuses = bonusItems.reduce((total, item) => total + item.amount, 0);

    // Calcular subsidio de transporte
    let transportSubsidy = 0;
    if (salarySettings.transportSubsidy && salarySettings.transportSubsidy > 0) {
      transportSubsidy = salarySettings.transportSubsidy;
    }

    // Calcular subsidio por extras
    let overtimeSubsidy = 0;
    if (this.period.overtimeHours && this.period.overtimeHours > 0) {
      const overtimeRate = salarySettings.overtimeRate || 1.5; // 1.5x por defecto
      overtimeSubsidy = (salarySettings.hourlyRate || 0) * this.period.overtimeHours * overtimeRate;
    }

    // Calcular total de ingresos
    const totalEarnings = baseSalary + bonuses + transportSubsidy + overtimeSubsidy;

    // Calcular deducciones
    let deductions = 0;
    const deductionItems = this.items.filter(item => item.category === 'deductions');
    deductions = deductionItems.reduce((total, item) => total + item.amount, 0);

    // Calcular retenciones (si aplica)
    let taxWithholding = 0;
    let socialSecurity = 0;
    let healthInsurance = 0;

    if (salarySettings.withholdings) {
      if (salarySettings.withholdings.taxWithholding) {
        taxWithholding = totalEarnings * (salarySettings.withholdings.taxRate || 0.1);
      }
      if (salarySettings.withholdings.socialSecurity) {
        socialSecurity = totalEarnings * (salarySettings.withholdings.socialSecurityRate || 0.04);
      }
      if (salarySettings.withholdings.healthInsurance) {
        healthInsurance = totalEarnings * (salarySettings.withholdings.healthInsuranceRate || 0.04);
      }
    }

    // Calcular salario neto
    const totalDeductions = deductions + taxWithholding + socialSecurity + healthInsurance;
    const netPay = Math.max(0, totalEarnings - totalDeductions);

    // Actualizar cálculo
    this.calculation = {
      baseSalary,
      bonuses,
      transportSubsidy,
      overtimeSubsidy,
      totalEarnings,
      deductions,
      netPay,
      taxWithholding,
      socialSecurity,
      healthInsurance
    };

    return this.calculation;
  } catch (error) {
    throw new Error(`Error calculando nómina: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Método para aprobar nómina
payrollSchema.methods.approve = function(approvedBy: string) {
  if (this.status !== 'draft') {
    throw new Error('Solo se pueden aprobar nóminas en estado draft');
  }
  
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.updatedAt = new Date();
};

// Método para marcar como pagada
payrollSchema.methods.markAsPaid = function(paidBy: string, paymentReference?: string) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden pagar nóminas aprobadas');
  }
  
  this.status = 'paid';
  this.paidBy = paidBy;
  this.paidAt = new Date();
  this.paymentDate = new Date();
  if (paymentReference) {
    this.paymentReference = paymentReference;
  }
  this.updatedAt = new Date();
};

// Método para cancelar nómina
payrollSchema.methods.cancel = function(reason?: string) {
  if (this.status === 'paid') {
    throw new Error('No se puede cancelar una nómina ya pagada');
  }
  
  this.status = 'cancelled';
  if (reason) {
    this.notes = (this.notes || '') + `\nCancelada: ${reason}`;
  }
  this.updatedAt = new Date();
};

// Método estático para obtener nóminas por período
payrollSchema.statics.getPayrollsByPeriod = function(businessId: string, startDate: Date, endDate: Date) {
  return this.find({
    businessId,
    'period.startDate': { $gte: startDate },
    'period.endDate': { $lte: endDate }
  }).populate('employeeId', 'firstName lastName userInfo.position userInfo.department')
    .populate('createdBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .populate('paidBy', 'firstName lastName')
    .sort({ 'period.startDate': -1 });
};

// Método estático para obtener resumen de nómina por período
payrollSchema.statics.getPayrollSummary = function(businessId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        businessId,
        'period.startDate': { $gte: startDate },
        'period.endDate': { $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalGrossPay: { $sum: '$calculation.totalEarnings' },
        totalDeductions: { $sum: '$calculation.deductions' },
        totalNetPay: { $sum: '$calculation.netPay' },
        totalTaxWithholding: { $sum: '$calculation.taxWithholding' },
        totalSocialSecurity: { $sum: '$calculation.socialSecurity' },
        totalHealthInsurance: { $sum: '$calculation.healthInsurance' },
        totalBonuses: { $sum: '$calculation.bonuses' },
        totalTransportSubsidy: { $sum: '$calculation.transportSubsidy' },
        totalOvertimeSubsidy: { $sum: '$calculation.overtimeSubsidy' }
      }
    }
  ]);
};

export default mongoose.model<IPayroll>('Payroll', payrollSchema);
