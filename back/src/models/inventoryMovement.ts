import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryMovement extends Document {
  businessId: string;
  productId: string;
  
  // Información del movimiento
  movementType: 'in' | 'out' | 'adjustment' | 'transfer' | 'reserve' | 'release' | 'expired' | 'damaged' | 'loss' | 'theft' | 'breakage' | 'spillage';
  movementCategory: 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer' | 'reserve' | 'expired' | 'damaged' | 'production' | 'consumption' | 'loss' | 'theft' | 'breakage' | 'spillage';
  
  // Cantidades
  quantity: number; // Cantidad en unidades
  unitSize: number; // Tamaño de cada unidad (ml, gr, etc.)
  unitType: 'ml' | 'gr' | 'pcs' | 'oz' | 'lb';
  totalSize: number; // quantity * unitSize
  
  // Precios y costos
  unitCost: number; // Costo por unidad
  totalCost: number; // quantity * unitCost
  unitPrice?: number; // Precio de venta por unidad
  totalPrice?: number; // quantity * unitPrice
  
  // Stock antes y después
  stockBefore: number; // Stock antes del movimiento
  stockAfter: number; // Stock después del movimiento
  
  // Referencias
  referenceId?: string; // ID de la venta, compra, etc.
  referenceType?: 'sale' | 'purchase' | 'expense' | 'adjustment' | 'transfer';
  referenceNumber?: string; // Número de factura, compra, etc.
  
  // Información del movimiento
  reason: string; // Razón del movimiento
  description?: string; // Descripción detallada
  location?: string; // Ubicación del movimiento
  department?: string; // Departamento responsable
  
  // Usuario responsable
  performedBy: string; // ID del usuario que realizó el movimiento
  approvedBy?: string; // ID del usuario que aprobó el movimiento
  
  // Fechas
  movementDate: Date; // Fecha del movimiento
  expirationDate?: Date; // Fecha de vencimiento (para productos con vencimiento)
  
  // Estado
  status: 'pending' | 'completed' | 'cancelled' | 'reversed';
  
  // Notas y auditoría
  notes?: string;
  internalNotes?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información del movimiento
  movementType: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'transfer', 'reserve', 'release', 'expired', 'damaged', 'loss', 'theft', 'breakage', 'spillage'],
    required: true
  },
  movementCategory: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'transfer', 'reserve', 'expired', 'damaged', 'production', 'consumption', 'loss', 'theft', 'breakage', 'spillage'],
    required: true
  },
  
  // Cantidades
  quantity: {
    type: Number,
    required: true,
    min: 0
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
  totalSize: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Precios y costos
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: false,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: false,
    min: 0
  },
  
  // Stock antes y después
  stockBefore: {
    type: Number,
    required: true,
    min: 0
  },
  stockAfter: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Referencias
  referenceId: {
    type: String,
    required: false
  },
  referenceType: {
    type: String,
    enum: ['sale', 'purchase', 'expense', 'adjustment', 'transfer'],
    required: false
  },
  referenceNumber: {
    type: String,
    required: false,
    trim: true
  },
  
  // Información del movimiento
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  location: {
    type: String,
    required: false,
    trim: true
  },
  department: {
    type: String,
    required: false,
    trim: true
  },
  
  // Usuario responsable
  performedBy: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    required: false
  },
  
  // Fechas
  movementDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expirationDate: {
    type: Date,
    required: false
  },
  
  // Estado
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'reversed'],
    default: 'completed',
    required: true
  },
  
  // Notas y auditoría
  notes: {
    type: String,
    required: false,
    trim: true
  },
  internalNotes: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
inventoryMovementSchema.index({ businessId: 1, productId: 1 });
inventoryMovementSchema.index({ businessId: 1, movementType: 1 });
inventoryMovementSchema.index({ businessId: 1, movementCategory: 1 });
inventoryMovementSchema.index({ businessId: 1, movementDate: -1 });
inventoryMovementSchema.index({ businessId: 1, referenceId: 1 });
inventoryMovementSchema.index({ businessId: 1, performedBy: 1 });

// Middleware para calcular totales
inventoryMovementSchema.pre('save', function(next) {
  // Calcular tamaño total
  this.totalSize = this.quantity * this.unitSize;
  
  // Calcular costos totales
  this.totalCost = this.quantity * this.unitCost;
  
  // Calcular precios totales si existen
  if (this.unitPrice) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  
  next();
});

// Método para aprobar el movimiento
inventoryMovementSchema.methods.approve = function(userId: string, notes?: string) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aprobar movimientos pendientes');
  }
  
  this.status = 'completed';
  this.approvedBy = userId;
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para cancelar el movimiento
inventoryMovementSchema.methods.cancel = function(userId: string, reason: string) {
  if (this.status === 'completed') {
    throw new Error('No se puede cancelar un movimiento ya completado');
  }
  
  this.status = 'cancelled';
  this.internalNotes = reason;
  
  return this.save();
};

// Método para revertir el movimiento
inventoryMovementSchema.methods.reverse = function(userId: string, reason: string) {
  this.status = 'reversed';
  this.internalNotes = reason;
  
  return this.save();
};

// Método estático para crear movimiento de entrada
inventoryMovementSchema.statics.createInMovement = async function(
  businessId: string,
  productId: string,
  movementData: {
    quantity: number;
    unitSize: number;
    unitType: string;
    unitCost: number;
    stockBefore: number;
    stockAfter: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
    referenceNumber?: string;
    performedBy: string;
    [key: string]: any;
  }
) {
  const movement = new this({
    businessId,
    productId,
    movementType: 'in',
    movementCategory: 'purchase',
    ...movementData
  });
  
  return await movement.save();
};

// Método estático para crear movimiento de salida
inventoryMovementSchema.statics.createOutMovement = async function(
  businessId: string,
  productId: string,
  movementData: {
    quantity: number;
    unitSize: number;
    unitType: string;
    unitCost: number;
    unitPrice?: number;
    stockBefore: number;
    stockAfter: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
    referenceNumber?: string;
    performedBy: string;
    [key: string]: any;
  }
) {
  const movement = new this({
    businessId,
    productId,
    movementType: 'out',
    movementCategory: 'sale',
    ...movementData
  });
  
  return await movement.save();
};

// Método estático para crear movimiento de ajuste
inventoryMovementSchema.statics.createAdjustmentMovement = async function(
  businessId: string,
  productId: string,
  movementData: {
    quantity: number;
    unitSize: number;
    unitType: string;
    unitCost: number;
    stockBefore: number;
    stockAfter: number;
    reason: string;
    performedBy: string;
    [key: string]: any;
  }
) {
  const movement = new this({
    businessId,
    productId,
    movementType: 'adjustment',
    movementCategory: 'adjustment',
    ...movementData
  });
  
  return await movement.save();
};

// Método estático para crear movimiento de pérdida
inventoryMovementSchema.statics.createLossMovement = async function(
  businessId: string,
  productId: string,
  movementData: {
    quantity: number;
    unitSize: number;
    unitType: string;
    unitCost: number;
    stockBefore: number;
    stockAfter: number;
    lossType: 'loss' | 'theft' | 'breakage' | 'spillage' | 'expired' | 'damaged';
    reason: string;
    performedBy: string;
    [key: string]: any;
  }
) {
  const movement = new this({
    businessId,
    productId,
    movementType: movementData.lossType,
    movementCategory: movementData.lossType,
    ...movementData
  });
  
  return await movement.save();
};

// Método estático para obtener movimientos por producto
inventoryMovementSchema.statics.getProductMovements = async function(
  businessId: string,
  productId: string,
  filters: any = {}
) {
  const matchFilters = { businessId, productId, ...filters };
  
  return await this.find(matchFilters)
    .populate('performedBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ movementDate: -1 });
};

// Método estático para obtener resumen de movimientos
inventoryMovementSchema.statics.getMovementSummary = async function(
  businessId: string,
  filters: any = {}
) {
  const matchFilters = { businessId, ...filters };
  
  const summary = await this.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: '$movementType',
        totalMovements: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$totalCost' },
        totalPrice: { $sum: { $ifNull: ['$totalPrice', 0] } },
        byCategory: {
          $push: {
            category: '$movementCategory',
            quantity: '$quantity',
            cost: '$totalCost',
            price: { $ifNull: ['$totalPrice', 0] }
          }
        }
      }
    },
    { $sort: { totalQuantity: -1 } }
  ]);
  
  return summary;
};

// Método estático para obtener movimientos por fecha
inventoryMovementSchema.statics.getMovementsByDate = async function(
  businessId: string,
  startDate: Date,
  endDate: Date,
  filters: any = {}
) {
  const matchFilters = {
    businessId,
    movementDate: { $gte: startDate, $lte: endDate },
    ...filters
  };
  
  return await this.find(matchFilters)
    .populate('productId', 'name brand sku')
    .populate('performedBy', 'name email')
    .sort({ movementDate: -1 });
};

export default mongoose.model<IInventoryMovement>('InventoryMovement', inventoryMovementSchema);
