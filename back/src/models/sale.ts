import mongoose, { Schema, model } from "mongoose";
import Person from './person';
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
    expertId: string; // Cambiado a string para referenciar Person._id
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
    expertId: string; // Cambiado a string para referenciar Person._id
  }>;
  total: number;
  paymentMethod: Array<{
    payment: string;
    amount: number;
  }>;
  
  // Sistema de propinas y devoluciones
  tipAndChange?: {
    tipAmount: number; // Monto de la propina
    tipPaymentMethod: 'cash' | 'card' | 'transfer'; // Método de pago de la propina
    changeAmount: number; // Monto de devolución en efectivo
    changeReason?: string; // Razón de la devolución
    tipNotes?: string; // Notas sobre la propina
    changeNotes?: string; // Notas sobre la devolución
  };
  
  // Total real recibido (incluyendo propinas)
  totalReceived: number;
  
  // Total a devolver (si hay cambio)
  totalChange: number;
  // Nuevos campos para el sistema de facturación
  status: SaleStatus;
  invoiceNumber?: number; // Número de factura (solo cuando está cerrada)
  businessId?: string; // ID del negocio para multi-tenancy
  notes?: string; // Notas adicionales
  closedAt?: Date; // Fecha de cierre
  closedBy?: string; // Usuario que cerró la transacción
  
  // Sistema de comisiones
  commissions?: Array<{
    expertId: string;
    commissionType: 'service' | 'retail' | 'exceptional';
    serviceId?: number;
    retailId?: string;
    baseAmount: number;
    inputCosts?: number;
    netAmount: number;
    baseCommissionRate: number;
    appliedCommissionRate: number;
    commissionAmount: number;
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    exceptionalEvent?: {
      reason: string;
      adjustmentType: 'increase' | 'decrease';
      adjustmentAmount: number;
      adjustmentPercentage?: number;
      approvedBy: string;
      approvalDate: Date;
      notes?: string;
    };
  }>;
  
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
      type: Schema.Types.ObjectId,
      ref: 'Person',
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
  
  // Sistema de propinas y devoluciones
  tipAndChange: {
    tipAmount: {
      type: Number,
      required: false,
      min: 0,
      default: 0
    },
    tipPaymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      required: false,
      default: 'cash'
    },
    changeAmount: {
      type: Number,
      required: false,
      min: 0,
      default: 0
    },
    changeReason: {
      type: String,
      required: false
    },
    tipNotes: {
      type: String,
      required: false
    },
    changeNotes: {
      type: String,
      required: false
    }
  },
  
  // Total real recibido (incluyendo propinas)
  totalReceived: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  
  // Total a devolver (si hay cambio)
  totalChange: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  
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
  },
  
  // Sistema de comisiones
  commissions: [{
    expertId: {
      type: String,
      required: false
    },
    commissionType: {
      type: String,
      enum: ['service', 'retail', 'exceptional'],
      required: false
    },
    serviceId: {
      type: Number,
      required: false
    },
    retailId: {
      type: String,
      required: false
    },
    baseAmount: {
      type: Number,
      required: false
    },
    inputCosts: {
      type: Number,
      required: false
    },
    netAmount: {
      type: Number,
      required: false
    },
    baseCommissionRate: {
      type: Number,
      required: false
    },
    appliedCommissionRate: {
      type: Number,
      required: false
    },
    commissionAmount: {
      type: Number,
      required: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      required: false
    },
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
        required: false
      },
      adjustmentPercentage: {
        type: Number,
        required: false
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
    }
  }]
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

// Método de instancia para calcular comisiones
saleSchema.methods.calculateCommissions = async function(): Promise<void> {
  if (!this.businessId) {
    throw new Error('No se puede calcular comisiones sin businessId');
  }
  
  // Limpiar comisiones existentes
  this.commissions = [];
  
  // Calcular comisiones por servicios
  for (const service of this.services) {
    try {
      // Obtener información del experto
      const expert = await Person.findOne({ 
        _id: service.expertId,
        personType: 'expert',
        active: true
      });
      
      if (expert) {
        // Calcular costos de insumos
        const inputCosts = service.input.reduce((total: number, input: any) => total + input.amount, 0);
        
        // Verificar que el experto tiene configuración de comisiones
        if (!expert.expertInfo?.commissionSettings) {
          console.warn(`Experto ${expert._id} no tiene configuración de comisiones`);
          continue;
        }
        
        // Calcular comisión base
        const baseCommissionRate = expert.expertInfo.commissionSettings.serviceCommission;
        const appliedCommissionRate = baseCommissionRate;
        
        // Calcular monto neto según método de cálculo
        let netAmount = service.amount;
        if (expert.expertInfo.commissionSettings.serviceCalculationMethod === 'after_inputs') {
          netAmount = service.amount - inputCosts;
        }
        
        // Calcular comisión según el método configurado
        let commissionAmount = 0;
        if (expert.expertInfo.commissionSettings.serviceCalculationMethod === 'before_inputs') {
          // Comisión sobre el monto total del servicio
          commissionAmount = (service.amount * expert.expertInfo.commissionSettings.serviceCommission) / 100;
        } else {
          // Comisión sobre el monto neto (después de insumos)
          commissionAmount = (netAmount * expert.expertInfo.commissionSettings.serviceCommission) / 100;
        }
        
        // Aplicar comisión mínima si es necesario
        if (commissionAmount < expert.expertInfo.commissionSettings.minimumServiceCommission) {
          commissionAmount = expert.expertInfo.commissionSettings.minimumServiceCommission;
        }
        
        // Aplicar comisión máxima si está configurada
        if (expert.expertInfo.commissionSettings.maximumServiceCommission && 
            commissionAmount > expert.expertInfo.commissionSettings.maximumServiceCommission) {
          commissionAmount = expert.expertInfo.commissionSettings.maximumServiceCommission;
        }
        
        // Agregar comisión a la venta
        this.commissions.push({
          expertId: expert._id.toString(),
          commissionType: 'service',
          serviceId: service.serviceId,
          baseAmount: service.amount,
          inputCosts,
          netAmount,
          baseCommissionRate,
          appliedCommissionRate,
          commissionAmount,
          status: 'pending'
        });
      }
    } catch (error) {
      console.error(`Error calculando comisión para servicio ${service.serviceId}:`, error);
    }
  }
  
  // Calcular comisiones por retail
  for (const retail of this.retail) {
    try {
      // Obtener información del experto
      const expert = await Person.findOne({ 
        _id: retail.expertId,
        personType: 'expert',
        active: true
      });
      
      if (expert && expert.expertInfo?.commissionSettings) {
        // Calcular comisión por retail
        const baseCommissionRate = expert.expertInfo.commissionSettings.retailCommission;
        const appliedCommissionRate = baseCommissionRate;
        const commissionAmount = (retail.amount * expert.expertInfo.commissionSettings.retailCommission) / 100;
        
        // Agregar comisión a la venta
        this.commissions.push({
          expertId: expert._id.toString(),
          commissionType: 'retail',
          retailId: retail.productId.toString(),
          baseAmount: retail.amount,
          netAmount: retail.amount,
          baseCommissionRate,
          appliedCommissionRate,
          commissionAmount,
          status: 'pending'
        });
      }
    } catch (error) {
      console.error(`Error calculando comisión para retail ${retail.productId}:`, error);
    }
  }
  
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