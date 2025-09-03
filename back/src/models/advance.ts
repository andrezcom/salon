import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvance extends Document {
  businessId: string;
  expertId: string;
  
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
  requestedBy: string; // ID del experto
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
  
  // Descuentos de comisiones
  commissionDeductions: Array<{
    commissionId: string;
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
  expertId: {
    type: String,
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
  
  // Descuentos de comisiones
  commissionDeductions: [{
    commissionId: {
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
advanceSchema.index({ businessId: 1, expertId: 1 });
advanceSchema.index({ businessId: 1, status: 1 });
advanceSchema.index({ businessId: 1, advanceType: 1 });
advanceSchema.index({ businessId: 1, requestDate: -1 });
advanceSchema.index({ businessId: 1, dueDate: 1 });

// Middleware para calcular el balance restante
advanceSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('commissionDeductions')) {
    const totalDeductions = this.commissionDeductions.reduce((total, deduction) => total + deduction.amount, 0);
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

// Método para aplicar descuento de comisión
advanceSchema.methods.applyCommissionDeduction = function(commissionId: string, amount: number, description: string) {
  if (this.status !== 'paid') {
    throw new Error('Solo se pueden aplicar descuentos a anticipos pagados');
  }
  
  if (amount > this.remainingBalance) {
    throw new Error('El monto del descuento excede el balance restante');
  }
  
  this.commissionDeductions.push({
    commissionId,
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
  expertId: string,
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
    expertId,
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

// Método estático para obtener resumen de anticipos por experto
advanceSchema.statics.getExpertAdvanceSummary = async function(businessId: string, expertId: string) {
  const summary = await this.aggregate([
    { $match: { businessId, expertId } },
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

export default mongoose.model<IAdvance>('Advance', advanceSchema);
