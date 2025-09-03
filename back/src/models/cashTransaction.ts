import mongoose, { Schema, Document } from 'mongoose';

export interface ICashTransaction extends Document {
  businessId: string;
  saleId: string;
  
  // Tipo de transacción
  transactionType: 'tip' | 'change' | 'refund' | 'adjustment';
  
  // Montos
  amount: number;
  previousBalance: number;
  newBalance: number;
  
  // Detalles de la transacción
  paymentMethod: 'cash' | 'card' | 'transfer';
  originalPaymentMethod: 'cash' | 'card' | 'transfer'; // Método original de la venta
  
  // Para propinas
  tipDetails?: {
    tipAmount: number;
    tipPercentage?: number;
    tipReason?: string;
    tipRecipient?: string; // Experto que recibe la propina
  };
  
  // Para devoluciones/cambios
  changeDetails?: {
    changeAmount: number;
    changeReason: string;
    changeNotes?: string;
    originalAmount: number; // Monto original pagado
  };
  
  // Para reembolsos
  refundDetails?: {
    refundAmount: number;
    refundReason: string;
    refundMethod: 'cash' | 'card' | 'transfer';
    refundNotes?: string;
    originalPaymentDate: Date;
  };
  
  // Para ajustes de caja
  adjustmentDetails?: {
    adjustmentType: 'increase' | 'decrease';
    adjustmentReason: string;
    adjustmentNotes?: string;
    approvedBy?: string;
  };
  
  // Estado de la transacción
  status: 'pending' | 'completed' | 'cancelled' | 'reversed';
  
  // Información de auditoría
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  reversedBy?: string;
  reversedAt?: Date;
  reversalReason?: string;
  
  // Notas adicionales
  notes?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const cashTransactionSchema = new Schema<ICashTransaction>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  saleId: {
    type: String,
    required: true,
    index: true
  },
  
  // Tipo de transacción
  transactionType: {
    type: String,
    enum: ['tip', 'change', 'refund', 'adjustment'],
    required: true
  },
  
  // Montos
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  previousBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  },
  
  // Detalles de la transacción
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    required: true
  },
  originalPaymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    required: true
  },
  
  // Para propinas
  tipDetails: {
    tipAmount: {
      type: Number,
      required: false,
      min: 0
    },
    tipPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100
    },
    tipReason: {
      type: String,
      required: false
    },
    tipRecipient: {
      type: String,
      required: false
    }
  },
  
  // Para devoluciones/cambios
  changeDetails: {
    changeAmount: {
      type: Number,
      required: false,
      min: 0
    },
    changeReason: {
      type: String,
      required: false
    },
    changeNotes: {
      type: String,
      required: false
    },
    originalAmount: {
      type: Number,
      required: false,
      min: 0
    }
  },
  
  // Para reembolsos
  refundDetails: {
    refundAmount: {
      type: Number,
      required: false,
      min: 0
    },
    refundReason: {
      type: String,
      required: false
    },
    refundMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      required: false
    },
    refundNotes: {
      type: String,
      required: false
    },
    originalPaymentDate: {
      type: Date,
      required: false
    }
  },
  
  // Para ajustes de caja
  adjustmentDetails: {
    adjustmentType: {
      type: String,
      enum: ['increase', 'decrease'],
      required: false
    },
    adjustmentReason: {
      type: String,
      required: false
    },
    adjustmentNotes: {
      type: String,
      required: false
    },
    approvedBy: {
      type: String,
      required: false
    }
  },
  
  // Estado de la transacción
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'reversed'],
    default: 'pending',
    required: true
  },
  
  // Información de auditoría
  createdBy: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    required: false
  },
  approvedAt: {
    type: Date,
    required: false
  },
  reversedBy: {
    type: String,
    required: false
  },
  reversedAt: {
    type: Date,
    required: false
  },
  reversalReason: {
    type: String,
    required: false
  },
  
  // Notas adicionales
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
cashTransactionSchema.index({ businessId: 1, transactionType: 1 });
cashTransactionSchema.index({ businessId: 1, saleId: 1 });
cashTransactionSchema.index({ businessId: 1, status: 1 });
cashTransactionSchema.index({ businessId: 1, createdAt: -1 });
cashTransactionSchema.index({ businessId: 1, paymentMethod: 1 });

// Middleware para calcular el nuevo balance antes de guardar
cashTransactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('previousBalance')) {
    this.newBalance = this.previousBalance + this.amount;
  }
  next();
});

// Método para aprobar la transacción
cashTransactionSchema.methods.approve = function(userId: string, notes?: string) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aprobar transacciones pendientes');
  }
  
  this.status = 'completed';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  
  return this.save();
};

// Método para cancelar la transacción
cashTransactionSchema.methods.cancel = function(userId: string, reason: string) {
  if (this.status === 'completed') {
    throw new Error('No se puede cancelar una transacción completada');
  }
  
  this.status = 'cancelled';
  this.notes = reason;
  
  return this.save();
};

// Método para revertir la transacción
cashTransactionSchema.methods.reverse = function(userId: string, reason: string) {
  if (this.status !== 'completed') {
    throw new Error('Solo se pueden revertir transacciones completadas');
  }
  
  this.status = 'reversed';
  this.reversedBy = userId;
  this.reversedAt = new Date();
  this.reversalReason = reason;
  
  return this.save();
};

// Método estático para crear transacción de propina
cashTransactionSchema.statics.createTipTransaction = async function(
  businessId: string,
  saleId: string,
  tipAmount: number,
  tipPaymentMethod: 'cash' | 'card' | 'transfer',
  originalPaymentMethod: 'cash' | 'card' | 'transfer',
  previousBalance: number,
  tipDetails: {
    tipPercentage?: number;
    tipReason?: string;
    tipRecipient?: string;
  },
  createdBy: string,
  notes?: string
) {
  const transaction = new this({
    businessId,
    saleId,
    transactionType: 'tip',
    amount: tipAmount,
    previousBalance,
    newBalance: previousBalance + tipAmount,
    paymentMethod: tipPaymentMethod,
    originalPaymentMethod,
    tipDetails: {
      tipAmount,
      ...tipDetails
    },
    createdBy,
    notes
  });
  
  return await transaction.save();
};

// Método estático para crear transacción de cambio
cashTransactionSchema.statics.createChangeTransaction = async function(
  businessId: string,
  saleId: string,
  changeAmount: number,
  originalPaymentMethod: 'cash' | 'card' | 'transfer',
  previousBalance: number,
  changeDetails: {
    changeReason: string;
    changeNotes?: string;
    originalAmount: number;
  },
  createdBy: string,
  notes?: string
) {
  const transaction = new this({
    businessId,
    saleId,
    transactionType: 'change',
    amount: -changeAmount, // Negativo porque reduce el balance de caja
    previousBalance,
    newBalance: previousBalance - changeAmount,
    paymentMethod: 'cash',
    originalPaymentMethod,
    changeDetails: {
      changeAmount,
      ...changeDetails
    },
    createdBy,
    notes
  });
  
  return await transaction.save();
};

// Método estático para crear transacción de reembolso
cashTransactionSchema.statics.createRefundTransaction = async function(
  businessId: string,
  saleId: string,
  refundAmount: number,
  refundMethod: 'cash' | 'card' | 'transfer',
  originalPaymentMethod: 'cash' | 'card' | 'transfer',
  previousBalance: number,
  refundDetails: {
    refundReason: string;
    refundNotes?: string;
    originalPaymentDate: Date;
  },
  createdBy: string,
  notes?: string
) {
  const transaction = new this({
    businessId,
    saleId,
    transactionType: 'refund',
    amount: -refundAmount, // Negativo porque reduce el balance de caja
    previousBalance,
    newBalance: previousBalance - refundAmount,
    paymentMethod: refundMethod,
    originalPaymentMethod,
    refundDetails: {
      refundAmount,
      ...refundDetails
    },
    createdBy,
    notes
  });
  
  return await transaction.save();
};

// Método estático para crear transacción de ajuste
cashTransactionSchema.statics.createAdjustmentTransaction = async function(
  businessId: string,
  saleId: string,
  adjustmentType: 'increase' | 'decrease',
  adjustmentAmount: number,
  previousBalance: number,
  adjustmentDetails: {
    adjustmentReason: string;
    adjustmentNotes?: string;
    approvedBy?: string;
  },
  createdBy: string,
  notes?: string
) {
  const amount = adjustmentType === 'increase' ? adjustmentAmount : -adjustmentAmount;
  
  const transaction = new this({
    businessId,
    saleId,
    transactionType: 'adjustment',
    amount,
    previousBalance,
    newBalance: previousBalance + amount,
    paymentMethod: 'cash',
    originalPaymentMethod: 'cash',
    adjustmentDetails: {
      adjustmentType,
      adjustmentAmount,
      ...adjustmentDetails
    },
    createdBy,
    notes
  });
  
  return await transaction.save();
};

export default mongoose.model<ICashTransaction>('CashTransaction', cashTransactionSchema);
