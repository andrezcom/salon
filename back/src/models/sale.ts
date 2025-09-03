import mongoose, { Schema, model } from "mongoose";
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Enum para los estados de la transacción
export enum SaleStatus {
  OPEN = 'abierta',
  IN_PROCESS = 'en_proceso',
  CLOSED = 'cerrada'
}

// Interfaz para la transacción
export interface ISale extends Document {
  idSale: number;
  idClient: string;
  nameClient: string;
  email: string;
  date: Date;
  services: Array<{
    serviceId: number;
    expertId: number;
    input: Array<{
      inputId: number;
      nameProduct: string;
      inputPrice: number;
      qty: number;
      amount: number;
    }>;
    amount: number;
  }>;
  retail: Array<{
    productId: number;
    clientPrice: number;
    qty: number;
    amount: number;
    expertId: number;
  }>;
  total: number;
  paymentMethod: Array<{
    payment: string;
    amount: number;
  }>;
  // Nuevos campos para el sistema de facturación
  status: SaleStatus;
  invoiceNumber?: number; // Número de factura (solo cuando está cerrada)
  businessId?: string; // ID del negocio para multi-tenancy
  notes?: string; // Notas adicionales
  closedAt?: Date; // Fecha de cierre
  closedBy?: string; // Usuario que cerró la transacción
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>({
  idClient: {
    type: String,
    required: true
  },
  nameClient: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true
  },
  services: [{
    serviceId: {
      type: Number,
      required: true
    },
    expertId: {
      type: Number,
      required: true
    },
    input: [{
      inputId: {
        type: Number,
        required: true
      },
      nameProduct: {
        type: String,
        required: true
      },
      inputPrice: {
        type: Number,
        required: true
      },
      qty: {
        type: Number,
        required: true
      },
      amount: {
        type: Number,
        required: true
      }
    }],
    amount: {
      type: Number,
      required: true
    }
  }],
  retail: [{
    productId: {
      type: Number,
      required: true
    },
    clientPrice: {
      type: Number,
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    expertId: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  paymentMethod: [{
    payment: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  // Nuevos campos para el sistema de facturación
  status: {
    type: String,
    enum: Object.values(SaleStatus),
    default: SaleStatus.OPEN,
    required: true
  },
  invoiceNumber: {
    type: Number,
    required: false,
    unique: true,
    sparse: true // Permite múltiples valores null/undefined
  },
  businessId: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  closedAt: {
    type: Date,
    required: false
  },
  closedBy: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Plugin para auto-incremento del ID de venta
saleSchema.plugin(AutoIncrement, { inc_field: 'idSale' });

// Índices para mejorar el rendimiento
saleSchema.index({ businessId: 1, status: 1 });
saleSchema.index({ businessId: 1, invoiceNumber: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ date: -1 });

// Middleware pre-save para validar el estado
saleSchema.pre('save', function(next) {
  // Si la transacción está cerrada, debe tener número de factura
  if (this.status === SaleStatus.CLOSED && !this.invoiceNumber) {
    return next(new Error('Las transacciones cerradas deben tener un número de factura'));
  }
  
  // Si la transacción está cerrada, debe tener fecha de cierre
  if (this.status === SaleStatus.CLOSED && !this.closedAt) {
    this.closedAt = new Date();
  }
  
  next();
});

// Método estático para obtener el próximo número de factura
saleSchema.statics.getNextInvoiceNumber = async function(businessId: string): Promise<number> {
  const lastInvoice = await this.findOne(
    { 
      businessId, 
      invoiceNumber: { $exists: true, $ne: null } 
    },
    { invoiceNumber: 1 }
  ).sort({ invoiceNumber: -1 });
  
  return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
};

// Método de instancia para cerrar la transacción
saleSchema.methods.closeTransaction = async function(userId: string, notes?: string): Promise<void> {
  if (this.status === SaleStatus.CLOSED) {
    throw new Error('La transacción ya está cerrada');
  }
  
  if (this.status === SaleStatus.OPEN) {
    throw new Error('No se puede cerrar una transacción abierta directamente. Debe estar en proceso primero.');
  }
  
  // Obtener el próximo número de factura
  const Sale = this.constructor as any;
  this.invoiceNumber = await Sale.getNextInvoiceNumber(this.businessId);
  
  this.status = SaleStatus.CLOSED;
  this.closedAt = new Date();
  this.closedBy = userId;
  if (notes) this.notes = notes;
  
  await this.save();
};

// Método de instancia para cambiar el estado
saleSchema.methods.changeStatus = async function(newStatus: SaleStatus, userId?: string, notes?: string): Promise<void> {
  if (this.status === SaleStatus.CLOSED) {
    throw new Error('No se puede cambiar el estado de una transacción cerrada');
  }
  
  // Validar transiciones de estado
  if (this.status === SaleStatus.OPEN && newStatus === SaleStatus.CLOSED) {
    throw new Error('No se puede cerrar una transacción abierta directamente. Debe estar en proceso primero.');
  }
  
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  // Si se está cerrando, asignar número de factura
  if (newStatus === SaleStatus.CLOSED) {
    const Sale = this.constructor as any;
    this.invoiceNumber = await Sale.getNextInvoiceNumber(this.businessId);
    this.closedAt = new Date();
    this.closedBy = userId;
  }
  
  await this.save();
};

export default model<ISale>('Sale', saleSchema);