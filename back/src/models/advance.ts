import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvance extends Document {
  businessId: string;
  employeeId: string; // Cambiado de expertId a employeeId para incluir todos los empleados
  employeeType: 'expert' | 'user'; // Tipo de empleado: experto o empleado regular
  
  // Información del anticipo
  advanceType: 'advance' | 'loan' | 'bonus' | 'expense_reimbursement';
  amount: number;
  requestedAmount: number; // Monto solicitado originalmente
  approvedAmount: number; // Monto aprobado (puede ser menor al solicitado)
  
  // Estado del anticipo
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled' | 'repaid';
  
  // Detalles del anticipo
  reason: string;
  description?: string;
  category?: string; // 'personal', 'business', 'emergency', 'bonus'
  
  // Fechas importantes
  requestDate: Date;
  approvalDate?: Date;
  paymentDate?: Date;
  dueDate?: Date; // Para préstamos
  repaymentDate?: Date; // Fecha de devolución
  
  // Información de aprobación
  requestedBy: string; // ID del empleado (experto o usuario regular)
  approvedBy?: string; // ID del aprobador
  rejectedBy?: string; // ID del rechazador
  rejectionReason?: string;
  
  // Información de pago
  paymentMethod: 'cash' | 'transfer' | 'check';
  paymentNotes?: string;
  
  // Para préstamos
  isLoan: boolean;
  interestRate?: number; // Tasa de interés si aplica
  repaymentSchedule?: {
    installments: number;
    installmentAmount: number;
    nextPaymentDate: Date;
  };
  
  // Para reembolsos de gastos
  expenseReceipts?: Array<{
    receiptNumber: string;
    amount: number;
    description: string;
    date: Date;
  }>;
  
  // Descuentos de comisiones (para expertos) o nómina (para empleados regulares)
  deductions: Array<{
    type: 'commission' | 'payroll'; // Tipo de descuento
    sourceId: string; // ID de la comisión o nómina
    amount: number;
    date: Date;
    description: string;
  }>;
  
  // Balance actual
  remainingBalance: number; // Saldo pendiente de devolver
  
  // Notas y auditoría
  notes?: string;
  internalNotes?: string; // Notas internas del negocio
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const advanceSchema = new Schema<IAdvance>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeType: {
    type: String,
    enum: ['expert', 'user'],
    required: true,
    index: true
  },
  
  // Información del anticipo
  advanceType: {
    type: String,
    enum: ['advance', 'loan', 'bonus', 'expense_reimbursement'],
    required: true,
    default: 'advance'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  approvedAmount: {
    type: Number,
    required: false,
    min: 0
  },
  
  // Estado del anticipo
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled', 'repaid'],
    default: 'pending',
    required: true
  },
  
  // Detalles del anticipo
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  category: {
    type: String,
    enum: ['personal', 'business', 'emergency', 'bonus'],
    required: false,
    default: 'personal'
  },
  
  // Fechas importantes
  requestDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  approvalDate: {
    type: Date,
    required: false
  },
  paymentDate: {
    type: Date,
    required: false
  },
  dueDate: {
    type: Date,
    required: false
  },
  repaymentDate: {
    type: Date,
    required: false
  },
  
  // Información de aprobación
  requestedBy: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    required: false
  },
  rejectedBy: {
    type: String,
    required: false
  },
  rejectionReason: {
    type: String,
    required: false
  },
  
  // Información de pago
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'check'],
    required: false
  },
  paymentNotes: {
    type: String,
    required: false
  },
  
  // Para préstamos
  isLoan: {
    type: Boolean,
    default: false
  },
  interestRate: {
    type: Number,
    required: false,
    min: 0,
    max: 100
  },
  repaymentSchedule: {
    installments: {
      type: Number,
      required: false,
      min: 1
    },
    installmentAmount: {
      type: Number,
      required: false,
      min: 0
    },
    nextPaymentDate: {
      type: Date,
      required: false
    }
  },
  
  // Para reembolsos de gastos
  expenseReceipts: [{
    receiptNumber: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  }],
  
  // Descuentos de comisiones (para expertos) o nómina (para empleados regulares)
  deductions: [{
    type: {
      type: String,
      enum: ['commission', 'payroll'],
      required: true
    },
    sourceId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  
  // Balance actual
  remainingBalance: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Notas y auditoría
  notes: {
    type: String,
    required: false
  },
  internalNotes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
advanceSchema.index({ businessId: 1, employeeId: 1 });
advanceSchema.index({ businessId: 1, employeeType: 1 });
advanceSchema.index({ businessId: 1, status: 1 });
advanceSchema.index({ businessId: 1, advanceType: 1 });
advanceSchema.index({ businessId: 1, requestDate: -1 });
advanceSchema.index({ businessId: 1, dueDate: 1 });

// Middleware para calcular el balance restante
advanceSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('deductions')) {
    const totalDeductions = this.deductions.reduce((total, deduction) => total + deduction.amount, 0);
    this.remainingBalance = Math.max(0, this.amount - totalDeductions);
  }
  next();
});

// Método para aprobar el anticipo
advanceSchema.methods.approve = function(userId: string, approvedAmount: number, notes?: string) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aprobar anticipos pendientes');
  }
  
  this.status = 'approved';
  this.approvedAmount = approvedAmount;
  this.approvedBy = userId;
  this.approvalDate = new Date();
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para rechazar el anticipo
advanceSchema.methods.reject = function(userId: string, reason: string, notes?: string) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden rechazar anticipos pendientes');
  }
  
  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectionReason = reason;
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para marcar como pagado
advanceSchema.methods.markAsPaid = function(paymentMethod: string, paymentNotes?: string) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden pagar anticipos aprobados');
  }
  
  this.status = 'paid';
  this.paymentDate = new Date();
  this.paymentMethod = paymentMethod;
  if (paymentNotes) this.paymentNotes = paymentNotes;
  
  return this.save();
};

// Método para cancelar el anticipo
advanceSchema.methods.cancel = function(userId: string, reason: string) {
  if (this.status === 'paid') {
    throw new Error('No se puede cancelar un anticipo ya pagado');
  }
  
  this.status = 'cancelled';
  this.internalNotes = reason;
  
  return this.save();
};

// Método para aplicar descuento (comisión o nómina)
advanceSchema.methods.applyDeduction = function(
  type: 'commission' | 'payroll', 
  sourceId: string, 
  amount: number, 
  description: string
) {
  if (this.status !== 'paid') {
    throw new Error('Solo se pueden aplicar descuentos a anticipos pagados');
  }
  
  if (amount > this.remainingBalance) {
    throw new Error('El monto del descuento excede el balance restante');
  }
  
  this.deductions.push({
    type,
    sourceId,
    amount,
    date: new Date(),
    description
  });
  
  return this.save();
};

// Método para marcar como reembolsado
advanceSchema.methods.markAsRepaid = function() {
  if (this.status !== 'paid') {
    throw new Error('Solo se pueden marcar como reembolsados anticipos pagados');
  }
  
  if (this.remainingBalance > 0) {
    throw new Error('No se puede marcar como reembolsado si hay balance pendiente');
  }
  
  this.status = 'repaid';
  this.repaymentDate = new Date();
  
  return this.save();
};

// Método estático para crear anticipo
advanceSchema.statics.createAdvance = async function(
  businessId: string,
  employeeId: string,
  employeeType: 'expert' | 'user',
  advanceType: 'advance' | 'loan' | 'bonus' | 'expense_reimbursement',
  amount: number,
  reason: string,
  requestedBy: string,
  options: {
    description?: string;
    category?: string;
    dueDate?: Date;
    isLoan?: boolean;
    interestRate?: number;
    expenseReceipts?: Array<{
      receiptNumber: string;
      amount: number;
      description: string;
      date: Date;
    }>;
  } = {}
) {
  const advance = new this({
    businessId,
    employeeId,
    employeeType,
    advanceType,
    amount,
    requestedAmount: amount,
    reason,
    requestedBy,
    remainingBalance: amount,
    ...options
  });
  
  return await advance.save();
};

// Método estático para obtener resumen de anticipos por empleado
advanceSchema.statics.getEmployeeAdvanceSummary = async function(businessId: string, employeeId: string) {
  const summary = await this.aggregate([
    { $match: { businessId, employeeId } },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        advances: { $push: '$$ROOT' }
      }
    }
  ]);
  
  const result = {
    totalRequested: 0,
    totalApproved: 0,
    totalPaid: 0,
    totalPending: 0,
    totalRejected: 0,
    totalCancelled: 0,
    totalRepaid: 0,
    remainingBalance: 0,
    advances: []
  };
  
  summary.forEach(group => {
    result[`total${group._id.charAt(0).toUpperCase() + group._id.slice(1)}`] = group.totalAmount;
    result.advances.push(...group.advances);
  });
  
  // Calcular balance restante
  result.remainingBalance = result.totalPaid - result.totalRepaid;
  
  return result;
};

// Método estático para obtener anticipos pendientes de descuento en nómina
advanceSchema.statics.getPendingPayrollDeductions = async function(businessId: string, employeeId: string) {
  return this.find({
    businessId,
    employeeId,
    employeeType: 'user', // Solo empleados regulares
    status: 'paid',
    remainingBalance: { $gt: 0 }
  }).sort({ requestDate: 1 });
};

// Método estático para obtener anticipos pendientes de descuento en comisiones
advanceSchema.statics.getPendingCommissionDeductions = async function(businessId: string, employeeId: string) {
  return this.find({
    businessId,
    employeeId,
    employeeType: 'expert', // Solo expertos
    status: 'paid',
    remainingBalance: { $gt: 0 }
  }).sort({ requestDate: 1 });
};

// Método estático para crear transacción de caja automática
advanceSchema.statics.createCashTransaction = async function(advance: any, transactionType: 'advance_payment' | 'advance_repayment') {
  const CashTransaction = mongoose.model('CashTransaction');
  
  // Obtener balance actual de caja
  const CashBalance = mongoose.model('CashBalance');
  const cashBalance = await CashBalance.findOne({ businessId: advance.businessId, status: 'open' });
  
  if (!cashBalance) {
    throw new Error('No hay balance de caja abierto para este negocio');
  }

  const previousBalance = cashBalance.currentBalance;
  const newBalance = transactionType === 'advance_payment' 
    ? previousBalance - advance.amount 
    : previousBalance + advance.amount;

  const transaction = new CashTransaction({
    businessId: advance.businessId,
    transactionType: transactionType,
    amount: advance.amount,
    previousBalance: previousBalance,
    newBalance: newBalance,
    paymentMethod: advance.paymentMethod || 'cash',
    reference: advance._id.toString(),
    employeeId: advance.employeeId,
    employeeType: advance.employeeType,
    status: 'completed',
    createdBy: advance.approvedBy,
    advanceDetails: {
      advanceId: advance._id.toString(),
      advanceType: advance.advanceType,
      advanceReason: advance.reason,
      advanceAmount: advance.amount,
      processedBy: advance.approvedBy,
      processedAt: new Date()
    }
  });
  
  // Actualizar balance de caja
  cashBalance.currentBalance = newBalance;
  cashBalance.lastTransactionDate = new Date();
  cashBalance.lastTransactionAmount = transactionType === 'advance_payment' ? -advance.amount : advance.amount;
  cashBalance.lastTransactionType = transactionType;
  await cashBalance.save();
  
  return await transaction.save();
};

export default mongoose.model<IAdvance>('Advance', advanceSchema);
