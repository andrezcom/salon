import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para configuración de períodos de comisiones
export interface ICommissionPeriodConfig extends Document {
  _id: string;
  businessId: string;
  name: string;
  description: string;
  settings: {
    periodType: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    startDay: number; // 0-6 (domingo-sábado) para semanal, 1-31 para mensual
    payDay: number; // Días después del fin del período para pagar
    cutoffTime: string; // Hora de corte (HH:MM)
    cutoffDay: number; // Día del mes para corte mensual
    gracePeriod: number; // Días de gracia para cerrar período
    autoClose: boolean; // Cerrar períodos automáticamente
    autoCloseTime: string; // Hora para cierre automático (HH:MM)
  };
  rules: {
    minimumCommission: number; // Comisión mínima para procesar
    maximumCommission: number; // Comisión máxima por período
    requireApproval: boolean; // Requerir aprobación antes de pagar
    approvalWorkflow: Array<{
      level: number;
      approverRole: string;
      required: boolean;
    }>;
    paymentMethod: 'cash' | 'transfer' | 'mixed'; // Método de pago por defecto
    paymentBatch: boolean; // Procesar pagos en lotes
    batchSize: number; // Tamaño del lote para pagos
  };
  notifications: {
    enabled: boolean;
    periodCloseReminder: boolean; // Recordatorio de cierre de período
    paymentReminder: boolean; // Recordatorio de pago
    expertNotifications: boolean; // Notificar a expertos
    emailRecipients: string[]; // Lista de emails para notificaciones
    reminderDays: number[]; // Días antes del evento para recordar
  };
  isActive: boolean;
  effectiveDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para configuración de períodos
const commissionPeriodConfigSchema = new Schema<ICommissionPeriodConfig>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  settings: {
    periodType: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
      required: true
    },
    startDay: {
      type: Number,
      required: true,
      min: 0,
      max: 31
    },
    payDay: {
      type: Number,
      required: true,
      min: 1,
      max: 30
    },
    cutoffTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    cutoffDay: {
      type: Number,
      min: 1,
      max: 31
    },
    gracePeriod: {
      type: Number,
      default: 2,
      min: 0,
      max: 7
    },
    autoClose: {
      type: Boolean,
      default: false
    },
    autoCloseTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  rules: {
    minimumCommission: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumCommission: {
      type: Number,
      min: 0
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    approvalWorkflow: [{
      level: {
        type: Number,
        required: true
      },
      approverRole: {
        type: String,
        required: true
      },
      required: {
        type: Boolean,
        default: true
      }
    }],
    paymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'mixed'],
      default: 'transfer'
    },
    paymentBatch: {
      type: Boolean,
      default: true
    },
    batchSize: {
      type: Number,
      default: 50,
      min: 1,
      max: 200
    }
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    periodCloseReminder: {
      type: Boolean,
      default: true
    },
    paymentReminder: {
      type: Boolean,
      default: true
    },
    expertNotifications: {
      type: Boolean,
      default: true
    },
    emailRecipients: [String],
    reminderDays: [{
      type: Number,
      min: 1,
      max: 30
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
commissionPeriodConfigSchema.index({ businessId: 1, isActive: 1 });
commissionPeriodConfigSchema.index({ businessId: 1, effectiveDate: 1, endDate: 1 });

// Métodos estáticos
commissionPeriodConfigSchema.statics.getActiveConfig = async function(businessId: string) {
  const now = new Date();
  return this.findOne({
    businessId,
    isActive: true,
    effectiveDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: now } }
    ]
  }).sort({ effectiveDate: -1 });
};

commissionPeriodConfigSchema.statics.generatePeriods = async function(
  businessId: string,
  year: number,
  config: ICommissionPeriodConfig
) {
  const periods = [];
  let periodNumber = 1;
  let currentDate = new Date(year, 0, 1);
  
  while (currentDate.getFullYear() === year) {
    let endDate: Date;
    let payDate: Date;
    
    switch (config.settings.periodType) {
      case 'weekly':
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'biweekly':
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 13);
        break;
      case 'monthly':
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        break;
      case 'quarterly':
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
        break;
      default:
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 6);
    }
    
    payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + config.settings.payDay);
    
    periods.push({
      periodNumber,
      startDate: new Date(currentDate),
      endDate: new Date(endDate),
      payDate: new Date(payDate),
      status: 'open'
    });
    
    currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1);
    periodNumber++;
  }
  
  return periods;
};

export default mongoose.model<ICommissionPeriodConfig>('CommissionPeriodConfig', commissionPeriodConfigSchema);
