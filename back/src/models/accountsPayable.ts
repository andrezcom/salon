import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountsPayable extends Document {
  _id: string;
  businessId: string;
  
  // Información del proveedor
  supplierId: string; // Referencia al proveedor
  supplierName: string;
  supplierCode: string;
  
  // Información de la factura
  invoiceNumber: string; // Número de factura del proveedor
  invoiceDate: Date; // Fecha de la factura
  dueDate: Date; // Fecha de vencimiento
  
  // Montos
  subtotal: number; // Subtotal sin impuestos
  taxAmount: number; // Monto de impuestos
  discountAmount: number; // Descuentos aplicados
  totalAmount: number; // Monto total a pagar
  paidAmount: number; // Monto ya pagado
  balanceAmount: number; // Saldo pendiente
  
  // Estado del pago
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: number; // Días de pago (30, 60, 90, etc.)
  
  // Información de pago
  paymentMethod?: 'cash' | 'transfer' | 'check' | 'credit';
  paymentReference?: string; // Referencia del pago
  paymentDate?: Date; // Fecha de pago
  
  // Desglose de productos/servicios
  items: Array<{
    productId?: string; // Si es producto
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }>;
  
  // Documentos adjuntos
  attachments: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
  
  // Notas y comentarios
  notes?: string;
  internalNotes?: string; // Notas internas
  
  // Auditoría
  createdBy: string;
  updatedBy?: string;
  paidBy?: string; // Quien procesó el pago
  createdAt: Date;
  updatedAt: Date;
}

const accountsPayableSchema = new Schema<IAccountsPayable>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información del proveedor
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  supplierCode: {
    type: String,
    required: true,
    trim: true
  },
  
  // Información de la factura
  invoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Montos
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  balanceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Estado del pago
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentTerms: {
    type: Number,
    required: true,
    min: 0,
    default: 30
  },
  
  // Información de pago
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'check', 'credit']
  },
  paymentReference: {
    type: String,
    trim: true
  },
  paymentDate: {
    type: Date
  },
  
  // Desglose de productos/servicios
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      trim: true
    }
  }],
  
  // Documentos adjuntos
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
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notas y comentarios
  notes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  
  // Auditoría
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  },
  paidBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  }
}, {
  timestamps: true,
  collection: 'accountsPayable'
});

// Índices para optimizar consultas
accountsPayableSchema.index({ businessId: 1, status: 1, dueDate: 1 });
accountsPayableSchema.index({ businessId: 1, supplierId: 1, status: 1 });
accountsPayableSchema.index({ businessId: 1, dueDate: 1, status: 1 });

// Middleware pre-save para calcular saldo
accountsPayableSchema.pre('save', function(next) {
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Actualizar estado basado en el saldo
  if (this.balanceAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (new Date() > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  
  next();
});

// Método para registrar pago
accountsPayableSchema.methods.recordPayment = function(
  amount: number, 
  paymentMethod: string, 
  paymentReference?: string,
  paidBy?: string
) {
  if (amount <= 0) {
    throw new Error('El monto del pago debe ser mayor a 0');
  }
  
  if (amount > this.balanceAmount) {
    throw new Error('El monto del pago no puede exceder el saldo pendiente');
  }
  
  this.paidAmount += amount;
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  this.paidBy = paidBy;
  this.paymentDate = new Date();
  
  return this.save();
};

// Método para cancelar factura
accountsPayableSchema.methods.cancel = function(reason?: string) {
  this.status = 'cancelled';
  if (reason) {
    this.internalNotes = (this.internalNotes || '') + `\nCancelada: ${reason}`;
  }
  return this.save();
};

// Método estático para obtener facturas vencidas
accountsPayableSchema.statics.getOverdueInvoices = function(businessId: string) {
  return this.find({
    businessId,
    status: { $in: ['pending', 'partial'] },
    dueDate: { $lt: new Date() }
  }).populate('supplierId', 'name contact.email contact.phone');
};

// Método estático para obtener resumen por proveedor
accountsPayableSchema.statics.getSupplierSummary = function(businessId: string, supplierId: string) {
  return this.aggregate([
    {
      $match: {
        businessId,
        supplierId: new mongoose.Types.ObjectId(supplierId),
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
        balanceAmount: { $sum: '$balanceAmount' },
        overdueAmount: {
          $sum: {
            $cond: [
              { $and: [
                { $gt: ['$dueDate', new Date()] },
                { $gt: ['$balanceAmount', 0] }
              ]},
              '$balanceAmount',
              0
            ]
          }
        }
      }
    }
  ]);
};

// Método estático para obtener resumen general
accountsPayableSchema.statics.getGeneralSummary = function(businessId: string) {
  return this.aggregate([
    {
      $match: {
        businessId,
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
        balanceAmount: { $sum: '$balanceAmount' },
        overdueCount: {
          $sum: {
            $cond: [
              { $and: [
                { $gt: ['$dueDate', new Date()] },
                { $gt: ['$balanceAmount', 0] }
              ]},
              1,
              0
            ]
          }
        },
        overdueAmount: {
          $sum: {
            $cond: [
              { $and: [
                { $gt: ['$dueDate', new Date()] },
                { $gt: ['$balanceAmount', 0] }
              ]},
              '$balanceAmount',
              0
            ]
          }
        }
      }
    }
  ]);
};

export default mongoose.model<IAccountsPayable>('AccountsPayable', accountsPayableSchema);
