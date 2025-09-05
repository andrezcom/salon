import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  businessId: string;
  
  // Información básica del producto
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  sku: string; // Código único del producto
  barcode?: string;
  
  // Precios y costos
  costPrice: number; // Costo de compra del producto
  inputPrice: number; // Precio como insumo (por gramo/ml)
  clientPrice: number; // Precio al cliente final
  expertPrice: number; // Precio al experto
  
  // Empaque y unidades
  packageInfo: {
    qtyPerPackage: number; // Cantidad de unidades por paquete
    unitSize: number; // Tamaño de cada unidad (ml, gr, etc.)
    unitType: 'ml' | 'gr' | 'pcs' | 'oz' | 'lb'; // Tipo de unidad
    packageSize?: number; // Tamaño total del paquete
    packageType?: string; // Tipo de empaque (botella, tubo, etc.)
  };
  
  // Usos del producto
  uses: {
    isInput: boolean; // Se usa como insumo
    isRetail: boolean; // Se vende al detalle
    isWholesale: boolean; // Se vende al por mayor
  };
  
  // Control de inventario
  inventory: {
    currentStock: number; // Stock actual en unidades
    minimumStock: number; // Stock mínimo para alertas
    maximumStock: number; // Stock máximo recomendado
    reservedStock: number; // Stock reservado para ventas
    reorderPoint: number; // Punto de reorden
    reorderQuantity: number; // Cantidad a reordenar
  };
  
  // Información de proveedores (múltiples proveedores por producto)
  suppliers: Array<{
    supplierId: string; // Referencia al proveedor
    supplierName: string; // Nombre del proveedor
    costPrice: number; // Costo específico de este proveedor
    minimumOrder: number; // Pedido mínimo
    leadTime: number; // Tiempo de entrega en días
    isPreferred: boolean; // Proveedor preferido
    isActive: boolean; // Si está activo para este producto
    lastPurchaseDate?: Date; // Última fecha de compra
    lastPurchasePrice?: number; // Último precio pagado
    notes?: string; // Notas específicas del proveedor
  }>;
  
  // Proveedor principal (para compatibilidad)
  primarySupplier: {
    supplierId: string;
    supplierName: string;
    costPrice: number;
  };
  
  // Estado y configuración
  isActive: boolean;
  isDiscontinued: boolean;
  requiresRefrigeration: boolean;
  expirationDate?: Date;
  
  // Campos para soft delete
  deletionReason?: string;
  deletedAt?: Date;
  
  // Notas y descripción
  description?: string;
  notes?: string;
  tags?: string[];
  
  // Auditoría
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información básica del producto
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    required: false,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  barcode: {
    type: String,
    required: false,
    trim: true
  },
  
  // Precios y costos
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  inputPrice: {
    type: Number,
    required: true,
    min: 0
  },
  clientPrice: {
    type: Number,
    required: true,
    min: 0
  },
  expertPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Empaque y unidades
  packageInfo: {
    qtyPerPackage: {
      type: Number,
      required: true,
      min: 1
    },
    unitSize: {
      type: Number,
      required: true,
      min: 0
    },
    unitType: {
      type: String,
      enum: ['ml', 'gr', 'pcs', 'oz', 'lb'],
      required: true
    },
    packageSize: {
      type: Number,
      required: false,
      min: 0
    },
    packageType: {
      type: String,
      required: false,
      trim: true
    }
  },
  
  // Usos del producto
  uses: {
    isInput: {
      type: Boolean,
      default: false
    },
    isRetail: {
      type: Boolean,
      default: false
    },
    isWholesale: {
      type: Boolean,
      default: false
    }
  },
  
  // Control de inventario
  inventory: {
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    maximumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 1000
    },
    reservedStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reorderQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  
  // Información de proveedores (múltiples proveedores por producto)
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
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    minimumOrder: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    leadTime: {
      type: Number,
      required: true,
      min: 0,
      default: 7 // 7 días por defecto
    },
    isPreferred: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastPurchaseDate: {
      type: Date
    },
    lastPurchasePrice: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Proveedor principal (para compatibilidad)
  primarySupplier: {
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
    costPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Estado y configuración
  isActive: {
    type: Boolean,
    default: true
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  
  // Campos para soft delete
  deletionReason: {
    type: String,
    required: false,
    trim: true
  },
  deletedAt: {
    type: Date,
    required: false
  },
  requiresRefrigeration: {
    type: Boolean,
    default: false
  },
  expirationDate: {
    type: Date,
    required: false
  },
  
  // Notas y descripción
  description: {
    type: String,
    required: false,
    trim: true
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ businessId: 1, brand: 1 });
productSchema.index({ businessId: 1, sku: 1 });
productSchema.index({ businessId: 1, 'uses.isInput': 1 });
productSchema.index({ businessId: 1, 'uses.isRetail': 1 });
productSchema.index({ businessId: 1, 'inventory.currentStock': 1 });
productSchema.index({ businessId: 1, isActive: 1 });

// Middleware para calcular el tamaño del paquete
productSchema.pre('save', function(next) {
  if (this.isModified('packageInfo.qtyPerPackage') || this.isModified('packageInfo.unitSize')) {
    this.packageInfo.packageSize = this.packageInfo.qtyPerPackage * this.packageInfo.unitSize;
  }
  next();
});

// Método para verificar si hay stock suficiente
productSchema.methods.hasStock = function(quantity: number): boolean {
  return this.inventory.currentStock >= quantity;
};

// Método para reservar stock
productSchema.methods.reserveStock = function(quantity: number): boolean {
  if (this.inventory.currentStock >= quantity) {
    this.inventory.currentStock -= quantity;
    this.inventory.reservedStock += quantity;
    return true;
  }
  return false;
};

// Método para liberar stock reservado
productSchema.methods.releaseReservedStock = function(quantity: number): void {
  this.inventory.reservedStock = Math.max(0, this.inventory.reservedStock - quantity);
  this.inventory.currentStock += quantity;
};

// Método para confirmar venta (reduce stock reservado)
productSchema.methods.confirmSale = function(quantity: number): void {
  this.inventory.reservedStock = Math.max(0, this.inventory.reservedStock - quantity);
};

// Método para verificar si tiene stock suficiente
productSchema.methods.hasStock = function(quantity: number): boolean {
  return this.inventory.currentStock >= quantity;
};

// Método para agregar stock
productSchema.methods.addStock = function(quantity: number, reason: string = 'Compra'): void {
  this.inventory.currentStock += quantity;
};

// Método para reducir stock
productSchema.methods.reduceStock = function(quantity: number, reason: string = 'Venta'): boolean {
  if (this.inventory.currentStock >= quantity) {
    this.inventory.currentStock -= quantity;
    return true;
  }
  return false;
};

// Método para registrar pérdida
productSchema.methods.recordLoss = function(quantity: number, lossType: string, reason: string = 'Pérdida'): boolean {
  if (this.inventory.currentStock >= quantity) {
    this.inventory.currentStock -= quantity;
    return true;
  }
  return false;
};

// Método para verificar si necesita reorden
productSchema.methods.needsReorder = function(): boolean {
  return this.inventory.currentStock <= this.inventory.reorderPoint;
};

// Método para calcular precio por unidad
productSchema.methods.getPricePerUnit = function(priceType: 'input' | 'client' | 'expert'): number {
  const price = priceType === 'input' ? this.inputPrice : 
                priceType === 'client' ? this.clientPrice : this.expertPrice;
  return price / this.packageInfo.unitSize;
};

// Método estático para crear producto
productSchema.statics.createProduct = async function(
  businessId: string,
  productData: {
    name: string;
    brand: string;
    category: string;
    costPrice: number;
    inputPrice: number;
    clientPrice: number;
    expertPrice: number;
    packageInfo: any;
    uses: any;
    supplier: any;
    [key: string]: any;
  },
  userId: string
) {
  // Generar SKU único
  const sku = `${productData.brand.substring(0, 3).toUpperCase()}-${Date.now()}`;
  
  const product = new this({
    businessId,
    sku,
    ...productData,
    createdBy: userId,
    updatedBy: userId
  });
  
  return await product.save();
};

// Método estático para obtener productos con stock bajo
productSchema.statics.getLowStockProducts = async function(businessId: string) {
  return await this.find({
    businessId,
    isActive: true,
    $expr: {
      $lte: ['$inventory.currentStock', '$inventory.minimumStock']
    }
  }).sort({ 'inventory.currentStock': 1 });
};

// Método estático para obtener resumen de inventario
productSchema.statics.getInventorySummary = async function(businessId: string) {
  const summary = await this.aggregate([
    { $match: { businessId, isActive: true } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStockValue: {
          $sum: { $multiply: ['$inventory.currentStock', '$costPrice'] }
        },
        lowStockProducts: {
          $sum: {
            $cond: [
              { $lte: ['$inventory.currentStock', '$inventory.minimumStock'] },
              1, 0
            ]
          }
        },
        outOfStockProducts: {
          $sum: {
            $cond: [
              { $eq: ['$inventory.currentStock', 0] },
              1, 0
            ]
          }
        },
        byCategory: {
          $push: {
            category: '$category',
            stock: '$inventory.currentStock',
            value: { $multiply: ['$inventory.currentStock', '$costPrice'] }
          }
        }
      }
    }
  ]);
  
  return summary[0] || {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    byCategory: []
  };
};

export default mongoose.model<IProduct>('Product', productSchema);