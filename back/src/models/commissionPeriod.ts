import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para períodos de comisiones
export interface ICommissionPeriod extends Document {
  _id: string;
  businessId: string;
  periodNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: 'open' | 'closed' | 'approved' | 'paid' | 'cancelled';
  
  // Resumen del período
  summary: {
    totalExperts: number;
    totalCommissions: number;
    totalCount: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
    cancelledAmount: number;
  };
  
  // Comisiones por experto
  expertCommissions: Array<{
    expertId: string;
    expertName: string;
    expertAlias: string;
    totalCommissions: number;
    commissionCount: number;
    serviceCommissions: number;
    retailCommissions: number;
    exceptionalCommissions: number;
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    paymentMethod?: string;
    paymentDate?: Date;
    paymentNotes?: string;
    commissionIds: string[]; // IDs de las comisiones incluidas
  }>;
  
  // Información de procesamiento
  processedAt?: Date;
  processedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  paidBy?: string;
  
  // Notas y observaciones
  notes?: string;
  cancellationReason?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

// Schema para período de comisiones
const commissionPeriodSchema = new Schema<ICommissionPeriod>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  periodNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  payDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'approved', 'paid', 'cancelled'],
    default: 'open',
    required: true
  },
  summary: {
    totalExperts: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCommissions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCount: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    approvedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    cancelledAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  expertCommissions: [{
    expertId: {
      type: String,
      required: true
    },
    expertName: {
      type: String,
      required: true
    },
    expertAlias: {
      type: String,
      required: true
    },
    totalCommissions: {
      type: Number,
      required: true,
      min: 0
    },
    commissionCount: {
      type: Number,
      required: true,
      min: 0
    },
    serviceCommissions: {
      type: Number,
      default: 0,
      min: 0
    },
    retailCommissions: {
      type: Number,
      default: 0,
      min: 0
    },
    exceptionalCommissions: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending'
    },
    paymentMethod: String,
    paymentDate: Date,
    paymentNotes: String,
    commissionIds: [String]
  }],
  processedAt: Date,
  processedBy: String,
  approvedAt: Date,
  approvedBy: String,
  paidAt: Date,
  paidBy: String,
  notes: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
commissionPeriodSchema.index({ businessId: 1, year: 1, periodNumber: 1 }, { unique: true });
commissionPeriodSchema.index({ businessId: 1, status: 1 });
commissionPeriodSchema.index({ businessId: 1, startDate: 1, endDate: 1 });
commissionPeriodSchema.index({ businessId: 1, payDate: 1 });

// Métodos de instancia
commissionPeriodSchema.methods.close = function(processedBy: string, notes?: string) {
  if (this.status !== 'open') {
    throw new Error('Solo se pueden cerrar períodos abiertos');
  }
  
  this.status = 'closed';
  this.processedAt = new Date();
  this.processedBy = processedBy;
  if (notes) this.notes = notes;
  
  return this.save();
};

commissionPeriodSchema.methods.approve = function(approvedBy: string, notes?: string) {
  if (this.status !== 'closed') {
    throw new Error('Solo se pueden aprobar períodos cerrados');
  }
  
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = approvedBy;
  if (notes) this.notes = notes;
  
  return this.save();
};

commissionPeriodSchema.methods.pay = function(paidBy: string, paymentMethod: string, notes?: string) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden pagar períodos aprobados');
  }
  
  this.status = 'paid';
  this.paidAt = new Date();
  this.paidBy = paidBy;
  if (notes) this.notes = notes;
  
  // Marcar todas las comisiones del período como pagadas
  this.expertCommissions.forEach(expert => {
    expert.status = 'paid';
    expert.paymentDate = new Date();
    expert.paymentMethod = paymentMethod;
  });
  
  return this.save();
};

commissionPeriodSchema.methods.cancel = function(cancelledBy: string, reason: string) {
  if (this.status === 'paid') {
    throw new Error('No se puede cancelar un período ya pagado');
  }
  
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.processedBy = cancelledBy;
  
  // Marcar todas las comisiones del período como canceladas
  this.expertCommissions.forEach(expert => {
    expert.status = 'cancelled';
  });
  
  return this.save();
};

commissionPeriodSchema.methods.recalculate = async function() {
  // Recalcular resumen del período
  this.summary.totalExperts = this.expertCommissions.length;
  this.summary.totalCommissions = this.expertCommissions.reduce((sum, expert) => sum + expert.totalCommissions, 0);
  this.summary.totalCount = this.expertCommissions.reduce((sum, expert) => sum + expert.commissionCount, 0);
  
  this.summary.pendingAmount = this.expertCommissions
    .filter(expert => expert.status === 'pending')
    .reduce((sum, expert) => sum + expert.totalCommissions, 0);
    
  this.summary.approvedAmount = this.expertCommissions
    .filter(expert => expert.status === 'approved')
    .reduce((sum, expert) => sum + expert.totalCommissions, 0);
    
  this.summary.paidAmount = this.expertCommissions
    .filter(expert => expert.status === 'paid')
    .reduce((sum, expert) => sum + expert.totalCommissions, 0);
    
  this.summary.cancelledAmount = this.expertCommissions
    .filter(expert => expert.status === 'cancelled')
    .reduce((sum, expert) => sum + expert.totalCommissions, 0);
  
  return this.save();
};

// Métodos estáticos
commissionPeriodSchema.statics.getCurrentPeriod = async function(businessId: string) {
  const now = new Date();
  return this.findOne({
    businessId,
    startDate: { $lte: now },
    endDate: { $gte: now },
    status: 'open'
  });
};

commissionPeriodSchema.statics.getPeriodByDate = async function(businessId: string, date: Date) {
  return this.findOne({
    businessId,
    startDate: { $lte: date },
    endDate: { $gte: date }
  });
};

commissionPeriodSchema.statics.getPeriodsByYear = async function(businessId: string, year: number) {
  return this.find({
    businessId,
    year
  }).sort({ periodNumber: 1 });
};

commissionPeriodSchema.statics.getPendingPeriods = async function(businessId: string) {
  return this.find({
    businessId,
    status: { $in: ['closed', 'approved'] }
  }).sort({ payDate: 1 });
};

commissionPeriodSchema.statics.getOverduePeriods = async function(businessId: string) {
  const now = new Date();
  return this.find({
    businessId,
    status: { $in: ['closed', 'approved'] },
    payDate: { $lt: now }
  }).sort({ payDate: 1 });
};

export default mongoose.model<ICommissionPeriod>('CommissionPeriod', commissionPeriodSchema);
