import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierComparison extends Document {
  _id: string;
  businessId: string;
  
  // Información de la comparación
  comparisonName: string;
  comparisonDate: Date;
  productId?: string; // Si es comparación por producto específico
  category?: string; // Si es comparación por categoría
  
  // Proveedores comparados
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    
    // Información de precios
    pricing: {
      unitPrice: number;
      minimumOrder: number;
      volumeDiscounts: Array<{
        minQuantity: number;
        discountPercentage: number;
        finalPrice: number;
      }>;
      shippingCost: number;
      taxAmount: number;
      totalCost: number; // Costo total incluyendo todo
      costPerUnit: number; // Costo por unidad final
    };
    
    // Información de entrega
    delivery: {
      leadTime: number; // Días
      reliability: number; // Porcentaje de entregas a tiempo
      deliveryOptions: string[]; // Opciones de entrega
      deliveryGuarantee: boolean;
      expeditedDelivery: boolean;
      expeditedLeadTime?: number;
    };
    
    // Información de calidad
    quality: {
      rating: number; // 1-5
      defectRate: number; // Porcentaje
      returnRate: number; // Porcentaje
      certifications: string[]; // Certificaciones
      qualityGuarantee: boolean;
      warrantyPeriod: number; // Días
    };
    
    // Información de servicio
    service: {
      responseTime: number; // Horas promedio
      communicationScore: number; // 1-5
      supportLevel: 'basic' | 'standard' | 'premium' | 'dedicated';
      technicalSupport: boolean;
      trainingProvided: boolean;
      documentationQuality: number; // 1-5
    };
    
    // Información comercial
    commercial: {
      paymentTerms: number; // Días
      creditLimit: number;
      discountPercentage?: number;
      latePaymentFee?: number;
      contractRequired: boolean;
      minimumContractValue?: number;
    };
    
    // Puntuación general
    overallScore: number; // 1-100
    recommendation: 'best' | 'good' | 'acceptable' | 'poor';
    pros: string[]; // Ventajas
    cons: string[]; // Desventajas
    notes: string; // Notas adicionales
  }>;
  
  // Análisis comparativo
  analysis: {
    bestPrice: {
      supplierId: string;
      supplierName: string;
      totalCost: number;
      savings: number; // Ahorro vs el más caro
    };
    
    bestQuality: {
      supplierId: string;
      supplierName: string;
      qualityScore: number;
    };
    
    bestDelivery: {
      supplierId: string;
      supplierName: string;
      leadTime: number;
      reliability: number;
    };
    
    bestService: {
      supplierId: string;
      supplierName: string;
      serviceScore: number;
    };
    
    bestOverall: {
      supplierId: string;
      supplierName: string;
      overallScore: number;
    };
    
    // Recomendaciones
    recommendations: Array<{
      type: 'price' | 'quality' | 'delivery' | 'service' | 'overall';
      supplierId: string;
      supplierName: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    
    // Análisis de riesgo
    riskAnalysis: {
      lowRisk: string[]; // Supplier IDs
      mediumRisk: string[]; // Supplier IDs
      highRisk: string[]; // Supplier IDs
      riskFactors: Array<{
        supplierId: string;
        riskType: 'financial' | 'operational' | 'quality' | 'delivery';
        description: string;
        severity: 'low' | 'medium' | 'high';
      }>;
    };
    
    // Resumen ejecutivo
    executiveSummary: {
      totalSuppliers: number;
      averagePrice: number;
      priceRange: {
        min: number;
        max: number;
        difference: number;
      };
      qualityRange: {
        min: number;
        max: number;
      };
      deliveryRange: {
        min: number;
        max: number;
      };
      keyInsights: string[];
      finalRecommendation: string;
    };
  };
  
  // Configuración de la comparación
  comparisonConfig: {
    weightFactors: {
      price: number; // Peso del precio (0-1)
      quality: number; // Peso de la calidad (0-1)
      delivery: number; // Peso de la entrega (0-1)
      service: number; // Peso del servicio (0-1)
    };
    includeInactive: boolean; // Incluir proveedores inactivos
    minimumRating: number; // Calificación mínima para incluir
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
  };
  
  // Auditoría
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierComparisonSchema = new Schema<ISupplierComparison>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información de la comparación
  comparisonName: {
    type: String,
    required: true,
    trim: true
  },
  comparisonDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  category: {
    type: String,
    trim: true
  },
  
  // Proveedores comparados
  suppliers: [{
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
    supplierCode: {
      type: String,
      required: true,
      trim: true
    },
    
    // Información de precios
    pricing: {
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      minimumOrder: {
        type: Number,
        required: true,
        min: 0
      },
      volumeDiscounts: [{
        minQuantity: {
          type: Number,
          required: true,
          min: 0
        },
        discountPercentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        },
        finalPrice: {
          type: Number,
          required: true,
          min: 0
        }
      }],
      shippingCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      taxAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      totalCost: {
        type: Number,
        required: true,
        min: 0
      },
      costPerUnit: {
        type: Number,
        required: true,
        min: 0
      }
    },
    
    // Información de entrega
    delivery: {
      leadTime: {
        type: Number,
        required: true,
        min: 0
      },
      reliability: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      deliveryOptions: [{
        type: String,
        trim: true
      }],
      deliveryGuarantee: {
        type: Boolean,
        default: false
      },
      expeditedDelivery: {
        type: Boolean,
        default: false
      },
      expeditedLeadTime: {
        type: Number,
        min: 0
      }
    },
    
    // Información de calidad
    quality: {
      rating: {
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
      certifications: [{
        type: String,
        trim: true
      }],
      qualityGuarantee: {
        type: Boolean,
        default: false
      },
      warrantyPeriod: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    
    // Información de servicio
    service: {
      responseTime: {
        type: Number,
        required: true,
        min: 0
      },
      communicationScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      supportLevel: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'dedicated'],
        required: true
      },
      technicalSupport: {
        type: Boolean,
        default: false
      },
      trainingProvided: {
        type: Boolean,
        default: false
      },
      documentationQuality: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      }
    },
    
    // Información comercial
    commercial: {
      paymentTerms: {
        type: Number,
        required: true,
        min: 0
      },
      creditLimit: {
        type: Number,
        required: true,
        min: 0
      },
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      latePaymentFee: {
        type: Number,
        min: 0
      },
      contractRequired: {
        type: Boolean,
        default: false
      },
      minimumContractValue: {
        type: Number,
        min: 0
      }
    },
    
    // Puntuación general
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    recommendation: {
      type: String,
      enum: ['best', 'good', 'acceptable', 'poor'],
      required: true
    },
    pros: [{
      type: String,
      trim: true
    }],
    cons: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Análisis comparativo
  analysis: {
    bestPrice: {
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
      totalCost: {
        type: Number,
        required: true,
        min: 0
      },
      savings: {
        type: Number,
        required: true,
        min: 0
      }
    },
    
    bestQuality: {
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
        min: 0,
        max: 100
      }
    },
    
    bestDelivery: {
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
      leadTime: {
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
    },
    
    bestService: {
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
      serviceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    },
    
    bestOverall: {
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
      overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    },
    
    // Recomendaciones
    recommendations: [{
      type: {
        type: String,
        enum: ['price', 'quality', 'delivery', 'service', 'overall'],
        required: true
      },
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
      reason: {
        type: String,
        required: true,
        trim: true
      },
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: true
      }
    }],
    
    // Análisis de riesgo
    riskAnalysis: {
      lowRisk: [{
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
      }],
      mediumRisk: [{
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
      }],
      highRisk: [{
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
      }],
      riskFactors: [{
        supplierId: {
          type: Schema.Types.ObjectId,
          ref: 'Supplier',
          required: true
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
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          required: true
        }
      }]
    },
    
    // Resumen ejecutivo
    executiveSummary: {
      totalSuppliers: {
        type: Number,
        required: true,
        min: 0
      },
      averagePrice: {
        type: Number,
        required: true,
        min: 0
      },
      priceRange: {
        min: {
          type: Number,
          required: true,
          min: 0
        },
        max: {
          type: Number,
          required: true,
          min: 0
        },
        difference: {
          type: Number,
          required: true,
          min: 0
        }
      },
      qualityRange: {
        min: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        },
        max: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        }
      },
      deliveryRange: {
        min: {
          type: Number,
          required: true,
          min: 0
        },
        max: {
          type: Number,
          required: true,
          min: 0
        }
      },
      keyInsights: [{
        type: String,
        trim: true
      }],
      finalRecommendation: {
        type: String,
        required: true,
        trim: true
      }
    }
  },
  
  // Configuración de la comparación
  comparisonConfig: {
    weightFactors: {
      price: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.3
      },
      quality: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.3
      },
      delivery: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.2
      },
      service: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.2
      }
    },
    includeInactive: {
      type: Boolean,
      default: false
    },
    minimumRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      }
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
  collection: 'supplierComparisons'
});

// Índices para optimizar consultas
supplierComparisonSchema.index({ businessId: 1, comparisonDate: -1 });
supplierComparisonSchema.index({ businessId: 1, productId: 1 });
supplierComparisonSchema.index({ businessId: 1, category: 1 });

// Método para calcular puntuación general
supplierComparisonSchema.methods.calculateOverallScore = function(supplier: any): number {
  const config = this.comparisonConfig.weightFactors;
  
  // Normalizar puntuaciones (0-100)
  const priceScore = Math.max(0, 100 - (supplier.pricing.costPerUnit / this.analysis.executiveSummary.averagePrice) * 100);
  const qualityScore = (supplier.quality.rating / 5) * 100;
  const deliveryScore = supplier.delivery.reliability;
  const serviceScore = (supplier.service.communicationScore / 5) * 100;
  
  // Calcular puntuación ponderada
  const overallScore = (
    priceScore * config.price +
    qualityScore * config.quality +
    deliveryScore * config.delivery +
    serviceScore * config.service
  );
  
  return Math.round(overallScore);
};

// Método para determinar recomendación
supplierComparisonSchema.methods.getRecommendation = function(score: number): string {
  if (score >= 90) return 'best';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  return 'poor';
};

// Método estático para generar comparación automática
supplierComparisonSchema.statics.generateComparison = async function(
  businessId: string,
  productId?: string,
  category?: string,
  config?: any
) {
  // Lógica para generar comparación automática
  // Esto se implementará en el controlador
};

export default mongoose.model<ISupplierComparison>('SupplierComparison', supplierComparisonSchema);
