import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrder extends Document {
  businessId: string;
  
  // Información básica de la orden
  orderNumber: string; // Número único de orden
  orderType: 'automatic' | 'manual' | 'reorder'; // Tipo de orden
  status: 'draft' | 'pending' | 'approved' | 'sent' | 'received' | 'cancelled';
  
  // Información del proveedor
  supplier: {
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  
  // Productos de la orden
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    currentStock: number;
    minimumStock: number;
    reorderQuantity: number;
    reason: string; // 'low_stock', 'out_of_stock', 'manual', 'reorder'
  }>;
  
  // Totales
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  
  // Fechas importantes
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Usuario responsable
  createdBy: string;
  approvedBy?: string;
  sentBy?: string;
  receivedBy?: string;
  
  // Notas y observaciones
  notes?: string;
  internalNotes?: string;
  
  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información básica de la orden
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderType: {
    type: String,
    enum: ['automatic', 'manual', 'reorder'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'sent', 'received', 'cancelled'],
    default: 'draft',
    required: true
  },
  
  // Información del proveedor
  supplier: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: false,
      trim: true
    },
    phone: {
      type: String,
      required: false,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true
    },
    address: {
      type: String,
      required: false,
      trim: true
    }
  },
  
  // Productos de la orden
  items: [{
    productId: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    productSku: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
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
    currentStock: {
      type: Number,
      required: true,
      min: 0
    },
    minimumStock: {
      type: Number,
      required: true,
      min: 0
    },
    reorderQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'manual', 'reorder'],
      required: true
    }
  }],
  
  // Totales
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Fechas importantes
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: false
  },
  actualDeliveryDate: {
    type: Date,
    required: false
  },
  
  // Usuario responsable
  createdBy: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    required: false
  },
  sentBy: {
    type: String,
    required: false
  },
  receivedBy: {
    type: String,
    required: false
  },
  
  // Notas y observaciones
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
purchaseOrderSchema.index({ businessId: 1, status: 1 });
purchaseOrderSchema.index({ businessId: 1, orderType: 1 });
purchaseOrderSchema.index({ businessId: 1, orderDate: -1 });
purchaseOrderSchema.index({ businessId: 1, 'supplier.name': 1 });

// Middleware para calcular totales
purchaseOrderSchema.pre('save', function(next) {
  // Calcular subtotal
  this.subtotal = this.items.reduce((total, item) => total + item.totalCost, 0);
  
  // Calcular total
  this.totalAmount = this.subtotal + this.taxAmount;
  
  next();
});

// Método para aprobar la orden
purchaseOrderSchema.methods.approve = function(userId: string, notes?: string) {
  if (this.status !== 'draft' && this.status !== 'pending') {
    throw new Error('Solo se pueden aprobar órdenes en borrador o pendientes');
  }
  
  this.status = 'approved';
  this.approvedBy = userId;
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para enviar la orden
purchaseOrderSchema.methods.send = function(userId: string, notes?: string) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden enviar órdenes aprobadas');
  }
  
  this.status = 'sent';
  this.sentBy = userId;
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para marcar como recibida
purchaseOrderSchema.methods.markAsReceived = function(userId: string, notes?: string) {
  if (this.status !== 'sent') {
    throw new Error('Solo se pueden marcar como recibidas órdenes enviadas');
  }
  
  this.status = 'received';
  this.receivedBy = userId;
  this.actualDeliveryDate = new Date();
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

// Método para cancelar la orden
purchaseOrderSchema.methods.cancel = function(userId: string, reason: string) {
  if (this.status === 'received') {
    throw new Error('No se puede cancelar una orden ya recibida');
  }
  
  this.status = 'cancelled';
  this.internalNotes = reason;
  
  return this.save();
};

// Método estático para generar orden automática
purchaseOrderSchema.statics.generateAutomaticOrder = async function(
  businessId: string,
  userId: string,
  options: {
    includeLowStock?: boolean;
    includeOutOfStock?: boolean;
    supplierFilter?: string;
    categoryFilter?: string;
  } = {}
) {
  const { includeLowStock = true, includeOutOfStock = true, supplierFilter, categoryFilter } = options;
  
  // Obtener productos que necesitan reorden
  const filters: any = { businessId, isActive: true };
  
  if (supplierFilter) {
    filters['supplier.name'] = supplierFilter;
  }
  
  if (categoryFilter) {
    filters.category = categoryFilter;
  }
  
  const products = await this.constructor.db.model('Product').find(filters);
  
  // Filtrar productos que necesitan reorden
  const productsToReorder = products.filter(product => {
    if (includeOutOfStock && product.inventory.currentStock === 0) {
      return true;
    }
    if (includeLowStock && product.inventory.currentStock <= product.inventory.minimumStock) {
      return true;
    }
    return false;
  });
  
  if (productsToReorder.length === 0) {
    return null; // No hay productos que necesiten reorden
  }
  
  // Agrupar por proveedor
  const supplierGroups = productsToReorder.reduce((groups, product) => {
    const supplierName = product.supplier.name;
    if (!groups[supplierName]) {
      groups[supplierName] = {
        supplier: product.supplier,
        products: []
      };
    }
    groups[supplierName].products.push(product);
    return groups;
  }, {});
  
  // Crear órdenes por proveedor
  const orders = [];
  
  for (const [supplierName, group] of Object.entries(supplierGroups)) {
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const items = group.products.map(product => {
      let quantity = product.inventory.reorderQuantity;
      let reason = 'reorder';
      
      if (product.inventory.currentStock === 0) {
        reason = 'out_of_stock';
        quantity = Math.max(quantity, product.inventory.minimumStock * 2);
      } else if (product.inventory.currentStock <= product.inventory.minimumStock) {
        reason = 'low_stock';
      }
      
      return {
        productId: product._id.toString(),
        productName: product.name,
        productSku: product.sku,
        quantity,
        unitCost: product.costPrice,
        totalCost: quantity * product.costPrice,
        currentStock: product.inventory.currentStock,
        minimumStock: product.inventory.minimumStock,
        reorderQuantity: product.inventory.reorderQuantity,
        reason
      };
    });
    
    const order = new this({
      businessId,
      orderNumber,
      orderType: 'automatic',
      status: 'draft',
      supplier: group.supplier,
      items,
      subtotal: items.reduce((total, item) => total + item.totalCost, 0),
      taxAmount: 0,
      totalAmount: items.reduce((total, item) => total + item.totalCost, 0),
      orderDate: new Date(),
      createdBy: userId,
      notes: 'Orden generada automáticamente por stock bajo'
    });
    
    await order.save();
    orders.push(order);
  }
  
  return orders;
};

// Método estático para obtener resumen de órdenes
purchaseOrderSchema.statics.getOrderSummary = async function(businessId: string, filters: any = {}) {
  const matchFilters = { businessId, ...filters };
  
  const summary = await this.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: '$status',
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  // Calcular totales generales
  const totals = await this.aggregate([
    { $match: matchFilters },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } },
        draftOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approvedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        sentOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        receivedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return {
    summary,
    totals: totals[0] || {
      totalOrders: 0,
      totalAmount: 0,
      totalItems: 0,
      draftOrders: 0,
      pendingOrders: 0,
      approvedOrders: 0,
      sentOrders: 0,
      receivedOrders: 0
    }
  };
};

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
