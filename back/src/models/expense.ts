import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  businessId: string;
  
  // Información básica del gasto
  expenseType: 'operational' | 'administrative' | 'maintenance' | 'personnel' | 'extraordinary' | 'marketing' | 'utilities' | 'insurance' | 'taxes' | 'other';
  category: string; // Categoría específica (ej: 'insumos', 'equipos', 'marketing')
  subcategory?: string; // Subcategoría más específica
  
  // Montos y facturación
  amount: number;
  taxAmount?: number; // IVA u otros impuestos
  totalAmount: number; // amount + taxAmount
  
  // Método de pago
  paymentMethod: 'cash' | 'transfer' | 'card' | 'check';
  paymentReference?: string; // Número de transferencia, comprobante, etc.
  
  // Estado del gasto
  status: 'pending' | 'approved' | 'paid' | 'cancelled' | 'rejected';
  
  // Información de la factura/proveedor
  vendorName?: string;
  vendorId?: string; // ID del proveedor si existe en el sistema
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  
  // Detalles del gasto
  description: string;
  detailedDescription?: string;
  location?: string; // Dónde se realizó el gasto
  department?: string; // Departamento responsable
  
  // Aprobaciones
  requestedBy: string; // ID del usuario que solicitó
  approvedBy?: string; // ID del usuario que aprobó
  rejectedBy?: string; // ID del usuario que rechazó
  rejectionReason?: string;
  
  // Fechas importantes
  requestDate: Date;
  approvalDate?: Date;
  paymentDate?: Date;
  rejectionDate?: Date;
  
  // Archivos adjuntos
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }>;
  
  // Para gastos recurrentes
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval: number; // Cada X días/semanas/meses
    endDate?: Date;
    nextDueDate?: Date;
  };
  
  // Para gastos con cuotas
  isInstallment: boolean;
  installmentDetails?: {
    totalInstallments: number;
    currentInstallment: number;
    installmentAmount: number;
    nextPaymentDate?: Date;
  };
  
  // Presupuesto y control
  budgetCategory?: string; // Categoría de presupuesto
  budgetAmount?: number; // Monto presupuestado
  budgetVariance?: number; // Diferencia con el presupuesto
  
  // Notas y auditoría
  notes?: string;
  internalNotes?: string; // Notas internas del negocio
  tags?: string[]; // Etiquetas para categorización
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información básica del gasto
  expenseType: {
    type: String,
    enum: ['operational', 'administrative', 'maintenance', 'personnel', 'extraordinary', 'marketing', 'utilities', 'insurance', 'taxes', 'other'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    required: false,
    trim: true
  },
  
  // Montos y facturación
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Método de pago
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'card', 'check'],
    required: true
  },
  paymentReference: {
    type: String,
    required: false,
    trim: true
  },
  
  // Estado del gasto
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled', 'rejected'],
    default: 'pending',
    required: true
  },
  
  // Información de la factura/proveedor
  vendorName: {
    type: String,
    required: false,
    trim: true
  },
  vendorId: {
    type: String,
    required: false
  },
  invoiceNumber: {
    type: String,
    required: false,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: false
  },
  dueDate: {
    type: Date,
    required: false
  },
  
  // Detalles del gasto
  description: {
    type: String,
    required: true,
    trim: true
  },
  detailedDescription: {
    type: String,
    required: false,
    trim: true
  },
  location: {
    type: String,
    required: false,
    trim: true
  },
  department: {
    type: String,
    required: false,
    trim: true
  },
  
  // Aprobaciones
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
    required: false,
    trim: true
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
  rejectionDate: {
    type: Date,
    required: false
  },
  
  // Archivos adjuntos
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  
  // Para gastos recurrentes
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: false
    },
    interval: {
      type: Number,
      required: false,
      min: 1
    },
    endDate: {
      type: Date,
      required: false
    },
    nextDueDate: {
      type: Date,
      required: false
    }
  },
  
  // Para gastos con cuotas
  isInstallment: {
    type: Boolean,
    default: false
  },
  installmentDetails: {
    totalInstallments: {
      type: Number,
      required: false,
      min: 1
    },
    currentInstallment: {
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
  
  // Presupuesto y control
  budgetCategory: {
    type: String,
    required: false,
    trim: true
  },
  budgetAmount: {
    type: Number,
    required: false,
    min: 0
  },
  budgetVariance: {
    type: Number,
    required: false
  },
  
  // Notas y auditoría
  notes: {
    type: String,
    required: false,
    trim: true
  },
  internalNotes: {
    type: String,
    required: false,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
expenseSchema.index({ businessId: 1, expenseType: 1 });
expenseSchema.index({ businessId: 1, status: 1 });
expenseSchema.index({ businessId: 1, category: 1 });
expenseSchema.index({ businessId: 1, paymentMethod: 1 });
expenseSchema.index({ businessId: 1, requestDate: -1 });
expenseSchema.index({ businessId: 1, dueDate: 1 });
expenseSchema.index({ businessId: 1, vendorId: 1 });

// Middleware para calcular el total antes de guardar
expenseSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('taxAmount')) {
    this.totalAmount = this.amount + (this.taxAmount || 0);
  }
  
  // Calcular variación del presupuesto si existe
  if (this.budgetAmount && this.totalAmount) {
    this.budgetVariance = this.totalAmount - this.budgetAmount;
  }
  
  next();
});

// Método para aprobar el gasto
expenseSchema.methods.approve = function(userId: string, notes?: string) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aprobar gastos pendientes');
  }
  
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvalDate = new Date();
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para rechazar el gasto
expenseSchema.methods.reject = function(userId: string, reason: string, notes?: string) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden rechazar gastos pendientes');
  }
  
  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectionReason = reason;
  this.rejectionDate = new Date();
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para marcar como pagado
expenseSchema.methods.markAsPaid = function(paymentDate?: Date, notes?: string) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden pagar gastos aprobados');
  }
  
  this.status = 'paid';
  this.paymentDate = paymentDate || new Date();
  if (notes) this.notes = notes;
  
  return this.save();
};

// Método para cancelar el gasto
expenseSchema.methods.cancel = function(userId: string, reason: string) {
  if (this.status === 'paid') {
    throw new Error('No se puede cancelar un gasto ya pagado');
  }
  
  this.status = 'cancelled';
  this.internalNotes = reason;
  
  return this.save();
};

// Método para crear el siguiente gasto recurrente
expenseSchema.methods.createNextRecurringExpense = function() {
  if (!this.isRecurring || !this.recurrencePattern) {
    throw new Error('Este gasto no es recurrente');
  }
  
  const nextExpense = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    requestDate: new Date(),
    status: 'pending',
    approvedBy: undefined,
    approvalDate: undefined,
    paymentDate: undefined,
    rejectionDate: undefined,
    rejectedBy: undefined,
    rejectionReason: undefined
  });
  
  // Calcular la siguiente fecha de vencimiento
  if (this.recurrencePattern.nextDueDate) {
    const currentDate = new Date(this.recurrencePattern.nextDueDate);
    
    switch (this.recurrencePattern.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + this.recurrencePattern.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (this.recurrencePattern.interval * 7));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + this.recurrencePattern.interval);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + (this.recurrencePattern.interval * 3));
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + this.recurrencePattern.interval);
        break;
    }
    
    nextExpense.recurrencePattern.nextDueDate = currentDate;
  }
  
  return nextExpense.save();
};

// Método estático para crear gasto
expenseSchema.statics.createExpense = async function(
  businessId: string,
  expenseData: {
    expenseType: string;
    category: string;
    subcategory?: string;
    amount: number;
    taxAmount?: number;
    paymentMethod: string;
    description: string;
    vendorName?: string;
    requestedBy: string;
    [key: string]: any;
  }
) {
  const expense = new this({
    businessId,
    ...expenseData,
    totalAmount: expenseData.amount + (expenseData.taxAmount || 0)
  });
  
  return await expense.save();
};

// Método estático para obtener resumen de gastos por categoría
expenseSchema.statics.getExpenseSummary = async function(businessId: string, filters: any = {}) {
  const matchFilters = { businessId, ...filters };
  
  const summary = await this.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$totalAmount' },
        totalCount: { $sum: 1 },
        byStatus: {
          $push: {
            status: '$status',
            amount: '$totalAmount'
          }
        },
        byType: {
          $push: {
            type: '$expenseType',
            amount: '$totalAmount'
          }
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  // Calcular totales generales
  const totals = await this.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        totalCount: { $sum: 1 },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0]
          }
        },
        approvedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$totalAmount', 0]
          }
        },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
          }
        },
        rejectedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'rejected'] }, '$totalAmount', 0]
          }
        },
        cancelledAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'cancelled'] }, '$totalAmount', 0]
          }
        }
      }
    }
  ]);
  
  return {
    summary,
    totals: totals[0] || {
      totalAmount: 0,
      totalCount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      rejectedAmount: 0,
      cancelledAmount: 0
    }
  };
};

export default mongoose.model<IExpense>('Expense', expenseSchema);
