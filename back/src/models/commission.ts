import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  businessId: string;
  expertId: string;
  saleId: string;
  
  // Tipo de comisión
  commissionType: 'service' | 'retail' | 'exceptional';
  
  // Detalles del servicio o retail
  serviceId?: number;
  retailId?: string;
  
  // Montos
  baseAmount: number; // Monto base sobre el que se calcula la comisión
  inputCosts?: number; // Costos de insumos (solo para servicios)
  netAmount: number; // Monto neto después de insumos
  
  // Comisión
  baseCommissionRate: number; // Porcentaje base del experto
  appliedCommissionRate: number; // Porcentaje aplicado (puede ser diferente por evento excepcional)
  commissionAmount: number; // Monto final de la comisión
  
  // Evento excepcional (opcional)
  exceptionalEvent?: {
    reason: string; // Razón del evento excepcional
    adjustmentType: 'increase' | 'decrease'; // Tipo de ajuste
    adjustmentAmount: number; // Monto del ajuste
    adjustmentPercentage?: number; // Porcentaje del ajuste
    approvedBy: string; // Usuario que aprobó
    approvalDate: Date;
    notes?: string;
  };
  
  // Estado de la comisión
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  
  // Información de pago
  paymentDate?: Date;
  paymentMethod?: string;
  paymentNotes?: string;
  
  // Auditoría
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>({
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
  saleId: {
    type: String,
    required: true,
    index: true
  },
  
  // Tipo de comisión
  commissionType: {
    type: String,
    enum: ['service', 'retail', 'exceptional'],
    required: true
  },
  
  // Detalles del servicio o retail
  serviceId: {
    type: Number,
    required: false
  },
  retailId: {
    type: String,
    required: false
  },
  
  // Montos
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  inputCosts: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Comisión
  baseCommissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  appliedCommissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Evento excepcional (opcional)
  exceptionalEvent: {
    reason: {
      type: String,
      required: false
    },
    adjustmentType: {
      type: String,
      enum: ['increase', 'decrease'],
      required: false
    },
    adjustmentAmount: {
      type: Number,
      required: false,
      min: 0
    },
    adjustmentPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100
    },
    approvedBy: {
      type: String,
      required: false
    },
    approvalDate: {
      type: Date,
      required: false
    },
    notes: {
      type: String,
      required: false
    }
  },
  
  // Estado de la comisión
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
    required: true
  },
  
  // Información de pago
  paymentDate: {
    type: Date,
    required: false
  },
  paymentMethod: {
    type: String,
    required: false
  },
  paymentNotes: {
    type: String,
    required: false
  },
  
  // Auditoría
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
commissionSchema.index({ businessId: 1, expertId: 1 });
commissionSchema.index({ businessId: 1, saleId: 1 });
commissionSchema.index({ businessId: 1, status: 1 });
commissionSchema.index({ expertId: 1, status: 1 });
commissionSchema.index({ createdAt: -1 });

// Middleware para calcular el monto neto antes de guardar
commissionSchema.pre('save', function(next) {
  if (this.isModified('baseAmount') || this.isModified('inputCosts')) {
    this.netAmount = this.baseAmount - (this.inputCosts || 0);
  }
  next();
});

// Método para aplicar evento excepcional
commissionSchema.methods.applyExceptionalEvent = function(
  reason: string,
  adjustmentType: 'increase' | 'decrease',
  adjustmentAmount: number,
  approvedBy: string,
  adjustmentPercentage?: number,
  notes?: string
) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aplicar eventos excepcionales a comisiones pendientes');
  }
  
  this.exceptionalEvent = {
    reason,
    adjustmentType,
    adjustmentAmount,
    adjustmentPercentage,
    approvedBy,
    approvalDate: new Date(),
    notes
  };
  
  // Recalcular comisión
  if (adjustmentType === 'increase') {
    this.commissionAmount += adjustmentAmount;
  } else {
    this.commissionAmount = Math.max(0, this.commissionAmount - adjustmentAmount);
  }
  
  this.commissionType = 'exceptional';
  this.status = 'approved';
  
  return this.save();
};

// Método para marcar como pagada
commissionSchema.methods.markAsPaid = function(
  paymentMethod: string,
  notes?: string
) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden pagar comisiones aprobadas');
  }
  
  this.status = 'paid';
  this.paymentDate = new Date();
  this.paymentMethod = paymentMethod;
  this.paymentNotes = notes;
  
  return this.save();
};

// Método estático para crear comisión por servicio
commissionSchema.statics.createServiceCommission = async function(
  businessId: string,
  expertId: string,
  saleId: string,
  serviceId: number,
  baseAmount: number,
  inputCosts: number,
  baseCommissionRate: number,
  appliedCommissionRate: number,
  createdBy: string
) {
  const netAmount = baseAmount - inputCosts;
  const commissionAmount = (netAmount * appliedCommissionRate) / 100;
  
  const commission = new this({
    businessId,
    expertId,
    saleId,
    commissionType: 'service',
    serviceId,
    baseAmount,
    inputCosts,
    netAmount,
    baseCommissionRate,
    appliedCommissionRate,
    commissionAmount,
    createdBy,
    updatedBy: createdBy
  });
  
  return await commission.save();
};

// Método estático para crear comisión por retail
commissionSchema.statics.createRetailCommission = async function(
  businessId: string,
  expertId: string,
  saleId: string,
  retailId: string,
  baseAmount: number,
  baseCommissionRate: number,
  appliedCommissionRate: number,
  createdBy: string
) {
  const commissionAmount = (baseAmount * appliedCommissionRate) / 100;
  
  const commission = new this({
    businessId,
    expertId,
    saleId,
    commissionType: 'retail',
    retailId,
    baseAmount,
    netAmount: baseAmount,
    baseCommissionRate,
    appliedCommissionRate,
    commissionAmount,
    createdBy,
    updatedBy: createdBy
  });
  
  return await commission.save();
};

export default mongoose.model<ICommission>('Commission', commissionSchema);
