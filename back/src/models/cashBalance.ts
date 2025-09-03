import mongoose, { Schema, Document } from 'mongoose';

export interface ICashBalance extends Document {
  businessId: string;
  date: Date;
  
  // Saldo inicial del día
  initialBalance: number;
  
  // Transacciones del día
  dailyTransactions: {
    totalSales: number;
    totalCash: number;
    totalTransfer: number;
    totalCard: number;
    totalCredit: number;
    transactionCount: number;
  };
  
  // Cuentas por cobrar
  accountsReceivable: {
    total: number;
    cashPayments: number;
    transferPayments: number;
    cardPayments: number;
    pendingAmount: number;
    paymentCount: number;
  };
  
  // Balance final
  finalBalance: number;
  
  // Auditoría
  openedBy: string;
  closedBy?: string;
  openedAt: Date;
  closedAt?: Date;
  notes?: string;
  
  // Estado del balance
  status: 'open' | 'closed';
  
  createdAt: Date;
  updatedAt: Date;
}

const cashBalanceSchema = new Schema<ICashBalance>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Saldo inicial del día
  initialBalance: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Transacciones del día
  dailyTransactions: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalCash: {
      type: Number,
      default: 0
    },
    totalTransfer: {
      type: Number,
      default: 0
    },
    totalCard: {
      type: Number,
      default: 0
    },
    totalCredit: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    }
  },
  
  // Cuentas por cobrar
  accountsReceivable: {
    total: {
      type: Number,
      default: 0
    },
    cashPayments: {
      type: Number,
      default: 0
    },
    transferPayments: {
      type: Number,
      default: 0
    },
    cardPayments: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    paymentCount: {
      type: Number,
      default: 0
    }
  },
  
  // Balance final
  finalBalance: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Auditoría
  openedBy: {
    type: String,
    required: true
  },
  closedBy: {
    type: String,
    required: false
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  
  // Estado del balance
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    required: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
cashBalanceSchema.index({ businessId: 1, date: 1 });
cashBalanceSchema.index({ businessId: 1, status: 1 });
cashBalanceSchema.index({ date: -1 });

// Middleware para calcular el balance final antes de guardar
cashBalanceSchema.pre('save', function(next) {
  if (this.isModified('dailyTransactions') || this.isModified('accountsReceivable')) {
    // Calcular balance final
    this.finalBalance = this.initialBalance + 
                       this.dailyTransactions.totalCash + 
                       this.dailyTransactions.totalTransfer + 
                       this.dailyTransactions.totalCard +
                       this.accountsReceivable.cashPayments +
                       this.accountsReceivable.transferPayments +
                       this.accountsReceivable.cardPayments;
  }
  next();
});

// Método estático para obtener o crear el balance del día
cashBalanceSchema.statics.getOrCreateDailyBalance = async function(businessId: string, date: Date, userId: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  let balance = await this.findOne({
    businessId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'open'
  });
  
  if (!balance) {
    // Obtener el balance del día anterior para calcular el saldo inicial
    const previousDay = new Date(startOfDay);
    previousDay.setDate(previousDay.getDate() - 1);
    
    const previousBalance = await this.findOne({
      businessId,
      date: { $gte: previousDay, $lt: startOfDay },
      status: 'closed'
    }).sort({ date: -1 });
    
    const initialBalance = previousBalance ? previousBalance.finalBalance : 0;
    
    balance = new this({
      businessId,
      date: startOfDay,
      initialBalance,
      openedBy: userId,
      status: 'open'
    });
    
    await balance.save();
  }
  
  return balance;
};

// Método para cerrar el balance del día
cashBalanceSchema.methods.closeBalance = async function(userId: string, notes?: string) {
  if (this.status === 'closed') {
    throw new Error('El balance ya está cerrado');
  }
  
  this.status = 'closed';
  this.closedBy = userId;
  this.closedAt = new Date();
  if (notes) this.notes = notes;
  
  return await this.save();
};

export default mongoose.model<ICashBalance>('CashBalance', cashBalanceSchema);
