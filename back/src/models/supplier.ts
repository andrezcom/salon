import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  _id: string;
  businessId: string;
  
  // Información básica del proveedor
  name: string;
  code: string; // Código único del proveedor
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer';
  
  // Información de contacto
  contact: {
    primaryContact: string;
    email: string;
    phone: string;
    mobile?: string;
    website?: string;
  };
  
  // Dirección
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Información fiscal
  taxInfo: {
    taxId: string; // RUT, NIT, etc.
    taxName: string;
    taxAddress?: string;
    taxExempt: boolean;
  };
  
  // Términos comerciales
  terms: {
    paymentTerms: number; // Días de pago (30, 60, 90, etc.)
    creditLimit: number; // Límite de crédito
    currency: string; // Moneda principal
    discountPercentage?: number; // Descuento por pronto pago
    latePaymentFee?: number; // Recargo por pago tardío
  };
  
  // Información bancaria
  banking: {
    bankName?: string;
    accountNumber?: string;
    accountType?: 'checking' | 'savings';
    routingNumber?: string;
    swiftCode?: string;
  };
  
  // Estado y configuración
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  rating: number; // Calificación del 1 al 5
  notes?: string;
  
  // Auditoría
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información básica del proveedor
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer'],
    required: true
  },
  
  // Información de contacto
  contact: {
    primaryContact: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Dirección
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'Colombia'
    }
  },
  
  // Información fiscal
  taxInfo: {
    taxId: {
      type: String,
      required: true,
      trim: true
    },
    taxName: {
      type: String,
      required: true,
      trim: true
    },
    taxAddress: {
      type: String,
      trim: true
    },
    taxExempt: {
      type: Boolean,
      default: false
    }
  },
  
  // Términos comerciales
  terms: {
    paymentTerms: {
      type: Number,
      required: true,
      min: 0,
      default: 30
    },
    creditLimit: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'COP'
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    latePaymentFee: {
      type: Number,
      min: 0
    }
  },
  
  // Información bancaria
  banking: {
    bankName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    accountType: {
      type: String,
      enum: ['checking', 'savings']
    },
    routingNumber: {
      type: String,
      trim: true
    },
    swiftCode: {
      type: String,
      trim: true
    }
  },
  
  // Estado y configuración
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active',
    index: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
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
  }
}, {
  timestamps: true,
  collection: 'suppliers'
});

// Índices para optimizar consultas
supplierSchema.index({ businessId: 1, status: 1 });
supplierSchema.index({ businessId: 1, name: 1 });
supplierSchema.index({ businessId: 1, code: 1 });

// Middleware pre-save para generar código único
supplierSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    const count = await this.constructor.countDocuments({ businessId: this.businessId });
    this.code = `PROV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para obtener proveedores activos
supplierSchema.statics.getActiveSuppliers = function(businessId: string) {
  return this.find({
    businessId,
    status: 'active'
  }).sort({ name: 1 });
};

// Método para obtener proveedores por tipo
supplierSchema.statics.getSuppliersByType = function(businessId: string, type: string) {
  return this.find({
    businessId,
    type,
    status: 'active'
  }).sort({ name: 1 });
};

// Método para actualizar calificación
supplierSchema.methods.updateRating = function(newRating: number) {
  if (newRating >= 1 && newRating <= 5) {
    this.rating = newRating;
    return this.save();
  }
  throw new Error('La calificación debe estar entre 1 y 5');
};

// Método para suspender proveedor
supplierSchema.methods.suspend = function(reason?: string) {
  this.status = 'suspended';
  if (reason) {
    this.notes = (this.notes || '') + `\nSuspendido: ${reason}`;
  }
  return this.save();
};

// Método para reactivar proveedor
supplierSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

export default mongoose.model<ISupplier>('Supplier', supplierSchema);
