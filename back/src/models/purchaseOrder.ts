import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrder extends Document {
  _id: string;
  businessId: string;
  
  // Información de la orden
  orderNumber: string; // Número único de la orden
  orderDate: Date; // Fecha de la orden
  expectedDeliveryDate: Date; // Fecha esperada de entrega
  actualDeliveryDate?: Date; // Fecha real de entrega
  
  // Información del proveedor
  supplierId: string; // Referencia al proveedor
  supplierName: string;
  supplierCode: string;
  
  // Estado de la orden
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
  
  // Montos
  subtotal: number; // Subtotal sin impuestos
  taxAmount: number; // Monto de impuestos
  discountAmount: number; // Descuentos aplicados
  shippingCost: number; // Costo de envío
  totalAmount: number; // Monto total
  
  // Productos solicitados
  items: Array<{
    productId: string; // Referencia al producto
    productName: string;
    productSku: string;
    quantity: number; // Cantidad solicitada
    quantityReceived: number; // Cantidad recibida
    unitPrice: number; // Precio unitario
    totalPrice: number; // Precio total
    notes?: string; // Notas específicas del producto
  }>;
  
  // Información de entrega
  delivery: {
    method: 'pickup' | 'delivery';
    address?: string; // Dirección de entrega
    contactPerson?: string; // Persona de contacto
    contactPhone?: string; // Teléfono de contacto
    specialInstructions?: string; // Instrucciones especiales
  };
  
  // Términos y condiciones
  terms: {
    paymentTerms: number; // Días de pago
    deliveryTerms: string; // Términos de entrega
    warranty?: string; // Garantía
    returnPolicy?: string; // Política de devoluciones
  };
  
  // Documentos adjuntos
  attachments: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
  
  // Notas y comentarios
  notes?: string;
  internalNotes?: string; // Notas internas
  
  // Auditoría
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string; // Quien aprobó la orden
  approvedAt?: Date; // Fecha de aprobación
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Información de la orden
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  
  // Información del proveedor
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
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
  
  // Estado de la orden
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'partial', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // Montos
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
  discountAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  shippingCost: {
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
  
  // Productos solicitados
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
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
      min: 0
    },
    quantityReceived: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Información de entrega
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true,
      default: 'delivery'
    },
    address: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    specialInstructions: {
      type: String,
      trim: true
    }
  },
  
  // Términos y condiciones
  terms: {
    paymentTerms: {
      type: Number,
      required: true,
      min: 0,
      default: 30
    },
    deliveryTerms: {
      type: String,
      required: true,
      default: 'FOB'
    },
    warranty: {
      type: String,
      trim: true
    },
    returnPolicy: {
      type: String,
      trim: true
    }
  },
  
  // Documentos adjuntos
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notas y comentarios
  notes: {
    type: String,
    trim: true
  },
  internalNotes: {
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
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'purchaseOrders'
});

// Índices para optimizar consultas
purchaseOrderSchema.index({ businessId: 1, status: 1, orderDate: -1 });
purchaseOrderSchema.index({ businessId: 1, supplierId: 1, status: 1 });
purchaseOrderSchema.index({ businessId: 1, orderNumber: 1 });

// Middleware pre-save para generar número de orden
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments({ businessId: this.businessId });
    const year = new Date().getFullYear();
    this.orderNumber = `PO-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Método para aprobar orden
purchaseOrderSchema.methods.approve = function(approvedBy: string) {
  if (this.status !== 'draft') {
    throw new Error('Solo se pueden aprobar órdenes en estado draft');
  }
  
  this.status = 'sent';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

// Método para confirmar orden
purchaseOrderSchema.methods.confirm = function() {
  if (this.status !== 'sent') {
    throw new Error('Solo se pueden confirmar órdenes enviadas');
  }
  
  this.status = 'confirmed';
  return this.save();
};

// Método para recibir productos
purchaseOrderSchema.methods.receiveItems = function(itemsReceived: Array<{productId: string, quantity: number}>) {
  if (this.status !== 'confirmed' && this.status !== 'partial') {
    throw new Error('Solo se pueden recibir productos de órdenes confirmadas');
  }
  
  let allItemsReceived = true;
  
  itemsReceived.forEach(received => {
    const item = this.items.find(i => i.productId.toString() === received.productId);
    if (item) {
      item.quantityReceived += received.quantity;
      
      if (item.quantityReceived < item.quantity) {
        allItemsReceived = false;
      }
    }
  });
  
  // Actualizar estado
  if (allItemsReceived) {
    this.status = 'completed';
    this.actualDeliveryDate = new Date();
  } else {
    this.status = 'partial';
  }
  
  return this.save();
};

// Método para cancelar orden
purchaseOrderSchema.methods.cancel = function(reason?: string) {
  if (this.status === 'completed') {
    throw new Error('No se puede cancelar una orden completada');
  }
  
  this.status = 'cancelled';
  if (reason) {
    this.internalNotes = (this.internalNotes || '') + `\nCancelada: ${reason}`;
  }
  return this.save();
};

// Método estático para obtener órdenes por proveedor
purchaseOrderSchema.statics.getOrdersBySupplier = function(businessId: string, supplierId: string) {
  return this.find({
    businessId,
    supplierId
  }).sort({ orderDate: -1 });
};

// Método estático para obtener resumen por proveedor
purchaseOrderSchema.statics.getSupplierSummary = function(businessId: string, supplierId: string) {
  return this.aggregate([
    {
      $match: {
        businessId,
        supplierId: new mongoose.Types.ObjectId(supplierId),
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $in: ['$status', ['sent', 'confirmed', 'partial']] }, 1, 0] }
        }
      }
    }
  ]);
};

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);