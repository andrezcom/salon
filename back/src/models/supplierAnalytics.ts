import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierAnalytics extends Document {
  _id: string;
  businessId: string;
  
  // Período de análisis
  period: {
    startDate: Date;
    endDate: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  
  // Métricas generales
  generalMetrics: {
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    newSuppliers: number;
    suppliersByType: {
      manufacturer: number;
      distributor: number;
      wholesaler: number;
      retailer: number;
    };
  };
  
  // Métricas financieras
  financialMetrics: {
    totalPurchaseValue: number;
    averageOrderValue: number;
    totalPayments: number;
    outstandingPayables: number;
    averagePaymentTime: number; // Días
    costSavings: number; // Ahorro vs proveedor anterior
    priceTrends: {
      increasing: number; // Número de proveedores con precios subiendo
      stable: number;
      decreasing: number;
    };
  };
  
  // Métricas de rendimiento
  performanceMetrics: {
    averageDeliveryTime: number; // Días
    onTimeDeliveryRate: number; // Porcentaje
    qualityScore: number; // 1-5
    defectRate: number; // Porcentaje
    returnRate: number; // Porcentaje
    customerSatisfaction: number; // 1-5
  };
  
  // Top proveedores
  topSuppliers: {
    byVolume: Array<{
      supplierId: string;
      supplierName: string;
      totalValue: number;
      percentage: number;
    }>;
    byQuality: Array<{
      supplierId: string;
      supplierName: string;
      qualityScore: number;
      defectRate: number;
    }>;
    byDelivery: Array<{
      supplierId: string;
      supplierName: string;
      deliveryTime: number;
      reliability: number;
    }>;
    byCost: Array<{
      supplierId: string;
      supplierName: string;
      averageCost: number;
      costSavings: number;
    }>;
  };
  
  // Análisis de riesgo
  riskAnalysis: {
    highRiskSuppliers: Array<{
      supplierId: string;
      supplierName: string;
      riskFactors: string[];
      riskScore: number; // 1-100
    }>;
    suppliersAtRisk: Array<{
      supplierId: string;
      supplierName: string;
      riskType: 'financial' | 'operational' | 'quality' | 'delivery';
      description: string;
    }>;
    contractExpirations: Array<{
      supplierId: string;
      supplierName: string;
      expirationDate: Date;
      daysUntilExpiration: number;
    }>;
  };
  
  // Tendencias y predicciones
  trends: {
    purchaseTrend: 'increasing' | 'stable' | 'decreasing';
    priceTrend: 'increasing' | 'stable' | 'decreasing';
    qualityTrend: 'improving' | 'stable' | 'declining';
    deliveryTrend: 'improving' | 'stable' | 'declining';
    
    predictions: {
      nextMonthPurchase: number;
      nextMonthCost: number;
      recommendedActions: string[];
    };
  };
  
  // Alertas y recomendaciones
  alerts: Array<{
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    relatedSupplier?: string;
  }>;
  
  recommendations: Array<{
    category: 'cost' | 'quality' | 'delivery' | 'risk' | 'relationship';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    priority: number; // 1-10
    suppliers: string[]; // Supplier IDs afectados
  }>;
  
  // Auditoría
  generatedAt: Date;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierAnalyticsSchema = new Schema<ISupplierAnalytics>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Período de análisis
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: true
    }
  },
  
  // Métricas generales
  generalMetrics: {
    totalSuppliers: {
      type: Number,
      required: true,
      min: 0
    },
    activeSuppliers: {
      type: Number,
      required: true,
      min: 0
    },
    inactiveSuppliers: {
      type: Number,
      required: true,
      min: 0
    },
    newSuppliers: {
      type: Number,
      required: true,
      min: 0
    },
    suppliersByType: {
      manufacturer: {
        type: Number,
        required: true,
        min: 0
      },
      distributor: {
        type: Number,
        required: true,
        min: 0
      },
      wholesaler: {
        type: Number,
        required: true,
        min: 0
      },
      retailer: {
        type: Number,
        required: true,
        min: 0
      }
    }
  },
  
  // Métricas financieras
  financialMetrics: {
    totalPurchaseValue: {
      type: Number,
      required: true,
      min: 0
    },
    averageOrderValue: {
      type: Number,
      required: true,
      min: 0
    },
    totalPayments: {
      type: Number,
      required: true,
      min: 0
    },
    outstandingPayables: {
      type: Number,
      required: true,
      min: 0
    },
    averagePaymentTime: {
      type: Number,
      required: true,
      min: 0
    },
    costSavings: {
      type: Number,
      required: true,
      default: 0
    },
    priceTrends: {
      increasing: {
        type: Number,
        required: true,
        min: 0
      },
      stable: {
        type: Number,
        required: true,
        min: 0
      },
      decreasing: {
        type: Number,
        required: true,
        min: 0
      }
    }
  },
  
  // Métricas de rendimiento
  performanceMetrics: {
    averageDeliveryTime: {
      type: Number,
      required: true,
      min: 0
    },
    onTimeDeliveryRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    defectRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    returnRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    customerSatisfaction: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  
  // Top proveedores
  topSuppliers: {
    byVolume: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      totalValue: {
        type: Number,
        required: true,
        min: 0
      },
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    byQuality: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      qualityScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      defectRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    byDelivery: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      deliveryTime: {
        type: Number,
        required: true,
        min: 0
      },
      reliability: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    byCost: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      averageCost: {
        type: Number,
        required: true,
        min: 0
      },
      costSavings: {
        type: Number,
        required: true
      }
    }]
  },
  
  // Análisis de riesgo
  riskAnalysis: {
    highRiskSuppliers: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      riskFactors: [{
        type: String,
        trim: true
      }],
      riskScore: {
        type: Number,
        required: true,
        min: 1,
        max: 100
      }
    }],
    suppliersAtRisk: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      riskType: {
        type: String,
        enum: ['financial', 'operational', 'quality', 'delivery'],
        required: true
      },
      description: {
        type: String,
        required: true,
        trim: true
      }
    }],
    contractExpirations: [{
      supplierId: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
      },
      supplierName: {
        type: String,
        required: true,
        trim: true
      },
      expirationDate: {
        type: Date,
        required: true
      },
      daysUntilExpiration: {
        type: Number,
        required: true
      }
    }]
  },
  
  // Tendencias y predicciones
  trends: {
    purchaseTrend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing'],
      required: true
    },
    priceTrend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing'],
      required: true
    },
    qualityTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      required: true
    },
    deliveryTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      required: true
    },
    
    predictions: {
      nextMonthPurchase: {
        type: Number,
        required: true,
        min: 0
      },
      nextMonthCost: {
        type: Number,
        required: true,
        min: 0
      },
      recommendedActions: [{
        type: String,
        trim: true
      }]
    }
  },
  
  // Alertas y recomendaciones
  alerts: [{
    type: {
      type: String,
      enum: ['warning', 'info', 'success', 'error'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    actionRequired: {
      type: Boolean,
      required: true
    },
    relatedSupplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier'
    }
  }],
  
  recommendations: [{
    category: {
      type: String,
      enum: ['cost', 'quality', 'delivery', 'risk', 'relationship'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    effort: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    suppliers: [{
      type: Schema.Types.ObjectId,
      ref: 'Supplier'
    }]
  }],
  
  // Auditoría
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  }
}, {
  timestamps: true,
  collection: 'supplierAnalytics'
});

// Índices para optimizar consultas
supplierAnalyticsSchema.index({ businessId: 1, 'period.startDate': -1 });
supplierAnalyticsSchema.index({ businessId: 1, 'period.type': 1 });
supplierAnalyticsSchema.index({ businessId: 1, generatedAt: -1 });

// Método estático para generar analytics
supplierAnalyticsSchema.statics.generateAnalytics = async function(
  businessId: string,
  periodType: string,
  startDate: Date,
  endDate: Date,
  generatedBy: string
) {
  // Lógica para generar analytics automáticamente
  // Esto se implementará en el controlador
};

export default mongoose.model<ISupplierAnalytics>('SupplierAnalytics', supplierAnalyticsSchema);
