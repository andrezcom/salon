import mongoose, { Schema, Document } from 'mongoose';

export interface ILoyaltyProgram extends Document {
  _id: string;
  businessId: string;
  
  // Información del programa
  name: string;
  description: string;
  isActive: boolean;
  
  // Configuración de puntos
  pointsConfig: {
    pointsPerDollar: number; // Puntos por dólar gastado
    pointsPerService: number; // Puntos por servicio
    pointsPerProduct: number; // Puntos por producto
    minimumPurchase: number; // Compra mínima para ganar puntos
    pointsExpirationDays?: number; // Días de expiración de puntos
  };
  
  // Niveles de cliente
  levels: Array<{
    name: string; // Bronce, Plata, Oro, Platino
    minPoints: number; // Puntos mínimos para alcanzar el nivel
    maxPoints?: number; // Puntos máximos del nivel
    benefits: {
      discountPercentage?: number; // Descuento por nivel
      freeService?: string; // Servicio gratuito
      priorityBooking?: boolean; // Reserva prioritaria
      birthdayDiscount?: number; // Descuento en cumpleaños
    };
    color: string; // Color del nivel
    icon?: string; // Icono del nivel
  }>;
  
  // Configuración de canje
  redemptionConfig: {
    pointsPerDollar: number; // Puntos necesarios por dólar de descuento
    minimumRedemption: number; // Mínimo de puntos para canjear
    maximumRedemption?: number; // Máximo de puntos por canje
    allowedForServices: boolean; // Si se puede canjear en servicios
    allowedForProducts: boolean; // Si se puede canjear en productos
  };
  
  // Configuración de notificaciones
  notifications: {
    pointsEarned: boolean; // Notificar cuando gana puntos
    levelUp: boolean; // Notificar cuando sube de nivel
    pointsExpiring: boolean; // Notificar cuando los puntos van a expirar
    birthday: boolean; // Notificar en cumpleaños
  };
  
  // Auditoría
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyProgramSchema = new Schema<ILoyaltyProgram>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información del programa
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Configuración de puntos
  pointsConfig: {
    pointsPerDollar: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    pointsPerService: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    pointsPerProduct: {
      type: Number,
      required: true,
      min: 0,
      default: 5
    },
    minimumPurchase: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    pointsExpirationDays: {
      type: Number,
      min: 0
    }
  },
  
  // Niveles de cliente
  levels: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    minPoints: {
      type: Number,
      required: true,
      min: 0
    },
    maxPoints: {
      type: Number,
      min: 0
    },
    benefits: {
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      freeService: {
        type: String,
        trim: true
      },
      priorityBooking: {
        type: Boolean,
        default: false
      },
      birthdayDiscount: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      trim: true
    }
  }],
  
  // Configuración de canje
  redemptionConfig: {
    pointsPerDollar: {
      type: Number,
      required: true,
      min: 1,
      default: 100
    },
    minimumRedemption: {
      type: Number,
      required: true,
      min: 1,
      default: 100
    },
    maximumRedemption: {
      type: Number,
      min: 1
    },
    allowedForServices: {
      type: Boolean,
      default: true
    },
    allowedForProducts: {
      type: Boolean,
      default: true
    }
  },
  
  // Configuración de notificaciones
  notifications: {
    pointsEarned: {
      type: Boolean,
      default: true
    },
    levelUp: {
      type: Boolean,
      default: true
    },
    pointsExpiring: {
      type: Boolean,
      default: true
    },
    birthday: {
      type: Boolean,
      default: true
    }
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
  }
}, {
  timestamps: true,
  collection: 'loyaltyPrograms'
});

// Índices para optimizar consultas
loyaltyProgramSchema.index({ businessId: 1, isActive: 1 });
loyaltyProgramSchema.index({ businessId: 1, name: 1 });

// Método para obtener el nivel actual basado en puntos
loyaltyProgramSchema.methods.getCurrentLevel = function(points: number) {
  const sortedLevels = this.levels.sort((a: any, b: any) => a.minPoints - b.minPoints);
  
  for (let i = sortedLevels.length - 1; i >= 0; i--) {
    const level = sortedLevels[i];
    if (points >= level.minPoints) {
      return level;
    }
  }
  
  return sortedLevels[0] || null;
};

// Método para calcular puntos a ganar
loyaltyProgramSchema.methods.calculatePoints = function(
  totalAmount: number,
  servicesCount: number,
  productsCount: number
): number {
  let points = 0;
  
  // Puntos por monto gastado
  if (totalAmount >= this.pointsConfig.minimumPurchase) {
    points += Math.floor(totalAmount * this.pointsConfig.pointsPerDollar);
  }
  
  // Puntos por servicios
  points += servicesCount * this.pointsConfig.pointsPerService;
  
  // Puntos por productos
  points += productsCount * this.pointsConfig.pointsPerProduct;
  
  return points;
};

// Método para calcular descuento por puntos
loyaltyProgramSchema.methods.calculateDiscountFromPoints = function(points: number): number {
  if (points < this.redemptionConfig.minimumRedemption) {
    return 0;
  }
  
  const maxRedemption = this.redemptionConfig.maximumRedemption || points;
  const usablePoints = Math.min(points, maxRedemption);
  
  return Math.floor(usablePoints / this.redemptionConfig.pointsPerDollar);
};

export default mongoose.model<ILoyaltyProgram>('LoyaltyProgram', loyaltyProgramSchema);
