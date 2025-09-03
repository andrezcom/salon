import mongoose, { Schema, Document } from "mongoose";

export interface IExpert extends Document {
  nameExpert: string;
  aliasExpert: string;
  email: string;
  phone: string;
  role: {
    stylist: boolean;
    manicure: boolean;
    makeup: boolean;
  };
  
  // Sistema de comisiones
  commissionSettings: {
    // Comisión base por servicios (porcentaje)
    serviceCommission: number;
    
    // Comisión por retail/ventas directas (porcentaje)
    retailCommission: number;
    
    // Método de cálculo de comisión por servicios
    serviceCalculationMethod: 'before_inputs' | 'after_inputs';
    
    // Comisión mínima por servicio (monto fijo)
    minimumServiceCommission: number;
    
    // Comisión máxima por servicio (monto fijo, opcional)
    maximumServiceCommission?: number;
  };
  
  // Estado del experto
  active: boolean;
  
  // Información adicional
  businessId?: string;
  hireDate: Date;
  notes?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const expertSchema = new Schema<IExpert>({
  nameExpert: {
    type: String,
    required: true,
    trim: true
  },
  aliasExpert: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    stylist: {
      type: Boolean,
      default: false
    },
    manicure: {
      type: Boolean,
      default: false
    },
    makeup: {
      type: Boolean,
      default: false
    }
  },
  
  // Sistema de comisiones
  commissionSettings: {
    // Comisión base por servicios (porcentaje)
    serviceCommission: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 20 // 20% por defecto
    },
    
    // Comisión por retail/ventas directas (porcentaje)
    retailCommission: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10 // 10% por defecto
    },
    
    // Método de cálculo de comisión por servicios
    serviceCalculationMethod: {
      type: String,
      enum: ['before_inputs', 'after_inputs'],
      default: 'after_inputs',
      required: true
    },
    
    // Comisión mínima por servicio (monto fijo)
    minimumServiceCommission: {
      type: Number,
      required: true,
      min: 0,
      default: 5 // $5 mínimo por servicio
    },
    
    // Comisión máxima por servicio (monto fijo, opcional)
    maximumServiceCommission: {
      type: Number,
      required: false,
      min: 0
    }
  },
  
  // Estado del experto
  active: {
    type: Boolean,
    default: true
  },
  
  // Información adicional
  businessId: {
    type: String,
    required: false
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
expertSchema.index({ businessId: 1, active: 1 });
expertSchema.index({ email: 1 });
expertSchema.index({ role: 1 });

// Método para calcular comisión por servicio
expertSchema.methods.calculateServiceCommission = function(serviceAmount: number, inputCosts: number = 0): number {
  let commissionAmount: number;
  
  if (this.commissionSettings.serviceCalculationMethod === 'before_inputs') {
    // Comisión calculada sobre el monto total del servicio
    commissionAmount = (serviceAmount * this.commissionSettings.serviceCommission) / 100;
  } else {
    // Comisión calculada después de descontar insumos
    const netAmount = serviceAmount - inputCosts;
    commissionAmount = (netAmount * this.commissionSettings.serviceCommission) / 100;
  }
  
  // Aplicar comisión mínima
  if (commissionAmount < this.commissionSettings.minimumServiceCommission) {
    commissionAmount = this.commissionSettings.minimumServiceCommission;
  }
  
  // Aplicar comisión máxima si está definida
  if (this.commissionSettings.maximumServiceCommission && 
      commissionAmount > this.commissionSettings.maximumServiceCommission) {
    commissionAmount = this.commissionSettings.maximumServiceCommission;
  }
  
  return Math.round(commissionAmount * 100) / 100; // Redondear a 2 decimales
};

// Método para calcular comisión por retail
expertSchema.methods.calculateRetailCommission = function(retailAmount: number): number {
  const commissionAmount = (retailAmount * this.commissionSettings.retailCommission) / 100;
  return Math.round(commissionAmount * 100) / 100; // Redondear a 2 decimales
};

// Método para validar configuración de comisiones
expertSchema.methods.validateCommissionSettings = function(): boolean {
  if (this.commissionSettings.serviceCommission < 0 || this.commissionSettings.serviceCommission > 100) {
    return false;
  }
  
  if (this.commissionSettings.retailCommission < 0 || this.commissionSettings.retailCommission > 100) {
    return false;
  }
  
  if (this.commissionSettings.minimumServiceCommission < 0) {
    return false;
  }
  
  if (this.commissionSettings.maximumServiceCommission && 
      this.commissionSettings.maximumServiceCommission < this.commissionSettings.minimumServiceCommission) {
    return false;
  }
  
  return true;
};

export default mongoose.model<IExpert>('Expert', expertSchema);