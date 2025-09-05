import mongoose, { Schema, Document } from 'mongoose';

export interface IClientRetention extends Document {
  _id: string;
  businessId: string;
  
  // Información del cliente
  customerId: string; // Referencia al cliente en Person
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Estado de retención
  status: 'active' | 'at_risk' | 'inactive' | 'recovered' | 'lost';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Fechas importantes
  lastVisitDate?: Date;
  firstVisitDate?: Date;
  daysSinceLastVisit: number;
  daysSinceFirstVisit: number;
  
  // Historial de visitas
  visitHistory: Array<{
    date: Date;
    services: string[];
    products: string[];
    totalAmount: number;
    expertId?: string;
    notes?: string;
  }>;
  
  // Métricas de comportamiento
  behaviorMetrics: {
    averageVisitFrequency: number; // Días entre visitas
    averageSpending: number;
    totalVisits: number;
    totalSpent: number;
    favoriteServices: string[];
    favoriteProducts: string[];
    preferredExpert?: string;
    preferredTimeSlot?: string;
    preferredDayOfWeek?: string;
  };
  
  // Campañas de recuperación
  recoveryCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    campaignType: 'email' | 'sms' | 'phone' | 'promotion' | 'personal_visit';
    sentDate: Date;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'responded' | 'failed';
    responseDate?: Date;
    responseType?: 'positive' | 'negative' | 'neutral';
    responseNotes?: string;
    followUpDate?: Date;
    followUpStatus?: 'pending' | 'completed' | 'cancelled';
    createdBy: string;
  }>;
  
  // Seguimiento de recuperación
  recoveryTracking: {
    totalCampaignsSent: number;
    totalResponses: number;
    positiveResponses: number;
    negativeResponses: number;
    lastCampaignDate?: Date;
    lastResponseDate?: Date;
    recoveryStatus: 'not_started' | 'in_progress' | 'successful' | 'failed' | 'abandoned';
    recoveryDate?: Date;
    recoveryMethod?: string;
    recoveryNotes?: string;
  };
  
  // Configuración de alertas
  alertSettings: {
    inactiveThreshold: number; // Días sin visitar para considerar inactivo
    atRiskThreshold: number; // Días para considerar en riesgo
    criticalThreshold: number; // Días para considerar crítico
    alertFrequency: 'daily' | 'weekly' | 'monthly';
    alertChannels: ('email' | 'sms' | 'dashboard')[];
    autoCampaignEnabled: boolean;
  };
  
  // Notas y observaciones
  notes: Array<{
    date: Date;
    type: 'general' | 'behavior' | 'preference' | 'issue' | 'recovery';
    content: string;
    createdBy: string;
  }>;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
  lastAnalyzedAt?: Date;
}

const clientRetentionSchema = new Schema<IClientRetention>({
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
  
  // Estado de retención
  status: {
    type: String,
    enum: ['active', 'at_risk', 'inactive', 'recovered', 'lost'],
    default: 'active',
    index: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  
  // Fechas importantes
  lastVisitDate: {
    type: Date
  },
  firstVisitDate: {
    type: Date
  },
  daysSinceLastVisit: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  daysSinceFirstVisit: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Historial de visitas
  visitHistory: [{
    date: {
      type: Date,
      required: true
    },
    services: [{
      type: String,
      trim: true
    }],
    products: [{
      type: String,
      trim: true
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Métricas de comportamiento
  behaviorMetrics: {
    averageVisitFrequency: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    averageSpending: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalVisits: {
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
    favoriteServices: [{
      type: String,
      trim: true
    }],
    favoriteProducts: [{
      type: String,
      trim: true
    }],
    preferredExpert: {
      type: String,
      trim: true
    },
    preferredTimeSlot: {
      type: String,
      trim: true
    },
    preferredDayOfWeek: {
      type: String,
      trim: true
    }
  },
  
  // Campañas de recuperación
  recoveryCampaigns: [{
    campaignId: {
      type: String,
      required: true,
      trim: true
    },
    campaignName: {
      type: String,
      required: true,
      trim: true
    },
    campaignType: {
      type: String,
      enum: ['email', 'sms', 'phone', 'promotion', 'personal_visit'],
      required: true
    },
    sentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'opened', 'clicked', 'responded', 'failed'],
      default: 'sent'
    },
    responseDate: {
      type: Date
    },
    responseType: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    responseNotes: {
      type: String,
      trim: true
    },
    followUpDate: {
      type: Date
    },
    followUpStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    }
  }],
  
  // Seguimiento de recuperación
  recoveryTracking: {
    totalCampaignsSent: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalResponses: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    positiveResponses: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    negativeResponses: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lastCampaignDate: {
      type: Date
    },
    lastResponseDate: {
      type: Date
    },
    recoveryStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'successful', 'failed', 'abandoned'],
      default: 'not_started'
    },
    recoveryDate: {
      type: Date
    },
    recoveryMethod: {
      type: String,
      trim: true
    },
    recoveryNotes: {
      type: String,
      trim: true
    }
  },
  
  // Configuración de alertas
  alertSettings: {
    inactiveThreshold: {
      type: Number,
      required: true,
      min: 1,
      default: 30 // 30 días sin visitar
    },
    atRiskThreshold: {
      type: Number,
      required: true,
      min: 1,
      default: 60 // 60 días sin visitar
    },
    criticalThreshold: {
      type: Number,
      required: true,
      min: 1,
      default: 90 // 90 días sin visitar
    },
    alertFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    alertChannels: [{
      type: String,
      enum: ['email', 'sms', 'dashboard']
    }],
    autoCampaignEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // Notas y observaciones
  notes: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['general', 'behavior', 'preference', 'issue', 'recovery'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    }
  }]
}, {
  timestamps: true,
  collection: 'clientRetentions'
});

// Índices para optimizar consultas
clientRetentionSchema.index({ businessId: 1, status: 1 });
clientRetentionSchema.index({ businessId: 1, riskLevel: 1 });
clientRetentionSchema.index({ businessId: 1, daysSinceLastVisit: -1 });
clientRetentionSchema.index({ businessId: 1, lastVisitDate: -1 });
clientRetentionSchema.index({ businessId: 1, customerId: 1 });

// Método para actualizar métricas de comportamiento
clientRetentionSchema.methods.updateBehaviorMetrics = function() {
  if (this.visitHistory.length === 0) {
    return;
  }
  
  // Calcular frecuencia promedio de visitas
  if (this.visitHistory.length > 1) {
    const sortedVisits = this.visitHistory.sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let totalDays = 0;
    for (let i = 1; i < sortedVisits.length; i++) {
      const daysDiff = Math.floor(
        (new Date(sortedVisits[i].date).getTime() - new Date(sortedVisits[i-1].date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      totalDays += daysDiff;
    }
    
    this.behaviorMetrics.averageVisitFrequency = totalDays / (sortedVisits.length - 1);
  }
  
  // Calcular gasto promedio
  const totalSpent = this.visitHistory.reduce((sum: number, visit: any) => sum + visit.totalAmount, 0);
  this.behaviorMetrics.totalSpent = totalSpent;
  this.behaviorMetrics.averageSpending = totalSpent / this.visitHistory.length;
  this.behaviorMetrics.totalVisits = this.visitHistory.length;
  
  // Identificar servicios y productos favoritos
  const serviceCounts: { [key: string]: number } = {};
  const productCounts: { [key: string]: number } = {};
  
  this.visitHistory.forEach((visit: any) => {
    visit.services.forEach((service: string) => {
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });
    visit.products.forEach((product: string) => {
      productCounts[product] = (productCounts[product] || 0) + 1;
    });
  });
  
  this.behaviorMetrics.favoriteServices = Object.entries(serviceCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([service]) => service);
    
  this.behaviorMetrics.favoriteProducts = Object.entries(productCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([product]) => product);
  
  return this.save();
};

// Método para determinar nivel de riesgo
clientRetentionSchema.methods.calculateRiskLevel = function() {
  if (this.daysSinceLastVisit <= this.alertSettings.atRiskThreshold) {
    this.riskLevel = 'low';
  } else if (this.daysSinceLastVisit <= this.alertSettings.criticalThreshold) {
    this.riskLevel = 'medium';
  } else if (this.daysSinceLastVisit <= this.alertSettings.criticalThreshold * 1.5) {
    this.riskLevel = 'high';
  } else {
    this.riskLevel = 'critical';
  }
  
  return this.save();
};

// Método para agregar visita
clientRetentionSchema.methods.addVisit = function(visitData: any) {
  this.visitHistory.push({
    ...visitData,
    date: new Date()
  });
  
  this.lastVisitDate = new Date();
  this.daysSinceLastVisit = 0;
  
  if (!this.firstVisitDate) {
    this.firstVisitDate = new Date();
  }
  
  this.daysSinceFirstVisit = Math.floor(
    (new Date().getTime() - new Date(this.firstVisitDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  this.status = 'active';
  this.riskLevel = 'low';
  
  return this.updateBehaviorMetrics();
};

// Método para agregar campaña de recuperación
clientRetentionSchema.methods.addRecoveryCampaign = function(campaignData: any) {
  this.recoveryCampaigns.push({
    ...campaignData,
    sentDate: new Date()
  });
  
  this.recoveryTracking.totalCampaignsSent += 1;
  this.recoveryTracking.lastCampaignDate = new Date();
  
  if (this.recoveryTracking.recoveryStatus === 'not_started') {
    this.recoveryTracking.recoveryStatus = 'in_progress';
  }
  
  return this.save();
};

// Método para registrar respuesta a campaña
clientRetentionSchema.methods.recordCampaignResponse = function(
  campaignId: string, 
  responseType: string, 
  notes?: string
) {
  const campaign = this.recoveryCampaigns.find((c: any) => c.campaignId === campaignId);
  if (campaign) {
    campaign.status = 'responded';
    campaign.responseDate = new Date();
    campaign.responseType = responseType;
    campaign.responseNotes = notes;
    
    this.recoveryTracking.totalResponses += 1;
    this.recoveryTracking.lastResponseDate = new Date();
    
    if (responseType === 'positive') {
      this.recoveryTracking.positiveResponses += 1;
    } else if (responseType === 'negative') {
      this.recoveryTracking.negativeResponses += 1;
    }
  }
  
  return this.save();
};

// Método estático para obtener clientes en riesgo
clientRetentionSchema.statics.getAtRiskCustomers = function(
  businessId: string, 
  riskLevel?: string
) {
  const query: any = { businessId, status: { $in: ['at_risk', 'inactive'] } };
  if (riskLevel) {
    query.riskLevel = riskLevel;
  }
  
  return this.find(query).sort({ daysSinceLastVisit: -1 });
};

// Método estático para obtener clientes críticos
clientRetentionSchema.statics.getCriticalCustomers = function(businessId: string) {
  return this.find({
    businessId,
    riskLevel: 'critical',
    status: { $in: ['at_risk', 'inactive'] }
  }).sort({ daysSinceLastVisit: -1 });
};

export default mongoose.model<IClientRetention>('ClientRetention', clientRetentionSchema);
