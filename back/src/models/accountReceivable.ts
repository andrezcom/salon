import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountReceivable extends Document {
  businessId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  
  // Información de la venta
  saleId: string;
  invoiceNumber: number;
  saleDate: Date;
  totalAmount: number;
  
  // Estado de la cuenta
  status: 'pending' | 'partial' | 'paid';
  pendingAmount: number;
  paidAmount: number;
  
  // Pagos realizados
  payments: Array<{
    amount: number;
    method: 'cash' | 'transfer' | 'card' | 'credit';
    date: Date;
    receivedBy: string;
    notes?: string;
  }>;
  
  // Fechas importantes
  dueDate: Date;
  lastPaymentDate?: Date;
  
  // Auditoría
  createdBy: string;
  updatedBy: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const accountReceivableSchema = new Schema<IAccountReceivable>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
    index: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  
  // Información de la venta
  saleId: {
    type: String,
    required: true,
    index: true
  },
  invoiceNumber: {
    type: Number,
    required: true,
    index: true
  },
  saleDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Estado de la cuenta
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
    required: true
  },
  pendingAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  
  // Pagos realizados
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      enum: ['cash', 'transfer', 'card', 'credit'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    receivedBy: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      required: false
    }
  }],
  
  // Fechas importantes
  dueDate: {
    type: Date,
    required: true
  },
  lastPaymentDate: {
    type: Date,
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
accountReceivableSchema.index({ businessId: 1, status: 1 });
accountReceivableSchema.index({ businessId: 1, clientId: 1 });
accountReceivableSchema.index({ businessId: 1, dueDate: 1 });
accountReceivableSchema.index({ status: 1, dueDate: 1 });

// Middleware para actualizar el estado y montos antes de guardar
accountReceivableSchema.pre('save', function(next) {
  if (this.isModified('payments') || this.isModified('paidAmount')) {
    // Calcular monto pagado total
    this.paidAmount = this.payments.reduce((total, payment) => total + payment.amount, 0);
    
    // Calcular monto pendiente
    this.pendingAmount = this.totalAmount - this.paidAmount;
    
    // Actualizar estado
    if (this.pendingAmount <= 0) {
      this.status = 'paid';
    } else if (this.paidAmount > 0) {
      this.status = 'partial';
    } else {
      this.status = 'pending';
    }
    
    // Actualizar fecha del último pago
    if (this.payments.length > 0) {
      this.lastPaymentDate = this.payments[this.payments.length - 1].date;
    }
  }
  next();
});

// Método para registrar un pago
accountReceivableSchema.methods.addPayment = async function(
  amount: number, 
  method: 'cash' | 'transfer' | 'card' | 'credit', 
  receivedBy: string, 
  notes?: string
) {
  if (this.status === 'paid') {
    throw new Error('La cuenta ya está completamente pagada');
  }
  
  if (amount > this.pendingAmount) {
    throw new Error('El monto del pago excede el monto pendiente');
  }
  
  this.payments.push({
    amount,
    method,
    date: new Date(),
    receivedBy,
    notes
  });
  
  return await this.save();
};

// Método estático para crear cuenta por cobrar desde una venta
accountReceivableSchema.statics.createFromSale = async function(
  businessId: string,
  saleData: any,
  createdBy: string,
  dueDate?: Date
) {
  const defaultDueDate = dueDate || new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30); // 30 días por defecto
  
  const account = new this({
    businessId,
    clientId: saleData.idClient,
    clientName: saleData.nameClient,
    clientEmail: saleData.email,
    saleId: saleData._id,
    invoiceNumber: saleData.invoiceNumber,
    saleDate: saleData.date,
    totalAmount: saleData.total,
    pendingAmount: saleData.total,
    dueDate: defaultDueDate,
    createdBy,
    updatedBy: createdBy
  });
  
  return await account.save();
};

export default mongoose.model<IAccountReceivable>('AccountReceivable', accountReceivableSchema);
