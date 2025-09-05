import mongoose, { Schema, Document } from 'mongoose';

export interface ILoyaltyCustomer extends Document {
  _id: string;
  businessId: string;
  
  // Información del cliente
  customerId: string; // Referencia al cliente en Person
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Información del programa de fidelidad
  loyaltyProgramId: string; // Referencia al programa de fidelidad
  loyaltyProgramName: string;
  
  // Puntos y nivel
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentLevel: string; // Nombre del nivel actual
  levelPoints: number; // Puntos en el nivel actual
  
  // Historial de puntos
  pointsHistory: Array<{
    date: Date;
    type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
    amount: number;
    description: string;
    saleId?: string; // Referencia a la venta
    expirationDate?: Date; // Fecha de expiración de los puntos
    createdBy?: string; // Quien creó el movimiento
  }>;
  
  // Estadísticas del cliente
  statistics: {
    totalPurchases: number;
    totalSpent: number;
    averagePurchase: number;
    lastPurchaseDate?: Date;
    firstPurchaseDate?: Date;
    favoriteServices: string[];
    favoriteProducts: string[];
    visitsCount: number;
  };
  
  // Configuración personal
  preferences: {
    receiveNotifications: boolean;
    notificationMethod: 'email' | 'sms' | 'both';
    birthday?: Date;
    anniversary?: Date; // Fecha de registro en el programa
  };
  
  // Estado del cliente
  status: 'active' | 'inactive' | 'suspended';
  isVIP: boolean; // Cliente VIP especial
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyCustomerSchema = new Schema<ILoyaltyCustomer>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información del cliente
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  
  // Información del programa de fidelidad
  loyaltyProgramId: {
    type: Schema.Types.ObjectId,
    ref: 'LoyaltyProgram',
    required: true,
    index: true
  },
  loyaltyProgramName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Puntos y nivel
  currentPoints: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPointsEarned: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPointsRedeemed: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currentLevel: {
    type: String,
    required: true,
    default: 'Bronce'
  },
  levelPoints: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Historial de puntos
  pointsHistory: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'adjusted'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale'
    },
    expirationDate: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    }
  }],
  
  // Estadísticas del cliente
  statistics: {
    totalPurchases: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalSpent: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    averagePurchase: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lastPurchaseDate: {
      type: Date
    },
    firstPurchaseDate: {
      type: Date
    },
    favoriteServices: [{
      type: String,
      trim: true
    }],
    favoriteProducts: [{
      type: String,
      trim: true
    }],
    visitsCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  
  // Configuración personal
  preferences: {
    receiveNotifications: {
      type: Boolean,
      default: true
    },
    notificationMethod: {
      type: String,
      enum: ['email', 'sms', 'both'],
      default: 'email'
    },
    birthday: {
      type: Date
    },
    anniversary: {
      type: Date,
      default: Date.now
    }
  },
  
  // Estado del cliente
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  isVIP: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'loyaltyCustomers'
});

// Índices para optimizar consultas
loyaltyCustomerSchema.index({ businessId: 1, customerId: 1 });
loyaltyCustomerSchema.index({ businessId: 1, loyaltyProgramId: 1 });
loyaltyCustomerSchema.index({ businessId: 1, currentLevel: 1 });
loyaltyCustomerSchema.index({ businessId: 1, currentPoints: -1 });
loyaltyCustomerSchema.index({ businessId: 1, status: 1 });
loyaltyCustomerSchema.index({ businessId: 1, isVIP: 1 });

// Método para agregar puntos
loyaltyCustomerSchema.methods.addPoints = function(
  amount: number,
  description: string,
  saleId?: string,
  createdBy?: string
) {
  this.currentPoints += amount;
  this.totalPointsEarned += amount;
  this.levelPoints += amount;
  
  this.pointsHistory.push({
    date: new Date(),
    type: 'earned',
    amount: amount,
    description: description,
    saleId: saleId,
    createdBy: createdBy
  });
  
  return this.save();
};

// Método para canjear puntos
loyaltyCustomerSchema.methods.redeemPoints = function(
  amount: number,
  description: string,
  saleId?: string,
  createdBy?: string
) {
  if (this.currentPoints < amount) {
    throw new Error('Puntos insuficientes para el canje');
  }
  
  this.currentPoints -= amount;
  this.totalPointsRedeemed += amount;
  this.levelPoints -= amount;
  
  this.pointsHistory.push({
    date: new Date(),
    type: 'redeemed',
    amount: -amount,
    description: description,
    saleId: saleId,
    createdBy: createdBy
  });
  
  return this.save();
};

// Método para actualizar estadísticas
loyaltyCustomerSchema.methods.updateStatistics = function(
  purchaseAmount: number,
  services: string[],
  products: string[]
) {
  this.statistics.totalPurchases += 1;
  this.statistics.totalSpent += purchaseAmount;
  this.statistics.averagePurchase = this.statistics.totalSpent / this.statistics.totalPurchases;
  this.statistics.lastPurchaseDate = new Date();
  this.statistics.visitsCount += 1;
  
  if (!this.statistics.firstPurchaseDate) {
    this.statistics.firstPurchaseDate = new Date();
  }
  
  // Actualizar servicios favoritos
  services.forEach(service => {
    if (!this.statistics.favoriteServices.includes(service)) {
      this.statistics.favoriteServices.push(service);
    }
  });
  
  // Actualizar productos favoritos
  products.forEach(product => {
    if (!this.statistics.favoriteProducts.includes(product)) {
      this.statistics.favoriteProducts.push(product);
    }
  });
  
  return this.save();
};

// Método para actualizar nivel
loyaltyCustomerSchema.methods.updateLevel = function(newLevel: string) {
  if (this.currentLevel !== newLevel) {
    this.currentLevel = newLevel;
    this.levelPoints = 0; // Resetear puntos del nivel
    return this.save();
  }
  return Promise.resolve(this);
};

// Método estático para obtener clientes por nivel
loyaltyCustomerSchema.statics.getCustomersByLevel = function(businessId: string, level: string) {
  return this.find({
    businessId,
    currentLevel: level,
    status: 'active'
  }).sort({ currentPoints: -1 });
};

// Método estático para obtener top clientes
loyaltyCustomerSchema.statics.getTopCustomers = function(businessId: string, limit: number = 10) {
  return this.find({
    businessId,
    status: 'active'
  }).sort({ currentPoints: -1 }).limit(limit);
};

export default mongoose.model<ILoyaltyCustomer>('LoyaltyCustomer', loyaltyCustomerSchema);
