import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el sistema de ausencias y permisos
export interface IAbsenceRequest {
  _id: string;
  employeeId: string;
  businessId: string;
  type: 'vacation' | 'sick_leave' | 'personal_leave' | 'maternity_leave' | 'paternity_leave' | 'bereavement_leave' | 'jury_duty' | 'military_leave' | 'unpaid_leave' | 'other';
  reason: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: 'morning' | 'afternoon';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedBy: string; // ID del empleado que solicita
  requestedAt: Date;
  approvedBy?: string; // ID del supervisor/manager que aprueba
  approvedAt?: Date;
  rejectionReason?: string;
  documents?: Array<{
    filename: string;
    originalName: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  notes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  coverage?: {
    assignedTo: string; // ID del empleado que cubre
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAbsenceBalance {
  _id: string;
  employeeId: string;
  businessId: string;
  year: number;
  balances: {
    vacation: {
      total: number;
      used: number;
      remaining: number;
      accrued: number;
    };
    sickLeave: {
      total: number;
      used: number;
      remaining: number;
    };
    personalLeave: {
      total: number;
      used: number;
      remaining: number;
    };
    maternityLeave: {
      total: number;
      used: number;
      remaining: number;
    };
    paternityLeave: {
      total: number;
      used: number;
      remaining: number;
    };
    other: {
      total: number;
      used: number;
      remaining: number;
    };
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAbsencePolicy {
  _id: string;
  businessId: string;
  name: string;
  description: string;
  policies: {
    vacation: {
      enabled: boolean;
      accrualRate: number; // días por mes
      maxAccrual: number; // máximo acumulable
      minRequestDays: number; // mínimo días para solicitar
      maxRequestDays: number; // máximo días por solicitud
      advanceNotice: number; // días de anticipación requeridos
      blackoutPeriods?: Array<{
        startDate: Date;
        endDate: Date;
        reason: string;
      }>;
    };
    sickLeave: {
      enabled: boolean;
      totalDays: number; // días por año
      requireDocumentation: boolean;
      maxConsecutiveDays: number;
    };
    personalLeave: {
      enabled: boolean;
      totalDays: number;
      requireApproval: boolean;
      advanceNotice: number;
    };
    maternityLeave: {
      enabled: boolean;
      totalDays: number;
      requireDocumentation: boolean;
      startBeforeDueDate: number; // días antes del parto
    };
    paternityLeave: {
      enabled: boolean;
      totalDays: number;
      requireDocumentation: boolean;
    };
    bereavementLeave: {
      enabled: boolean;
      immediateFamily: number; // días para familia inmediata
      extendedFamily: number; // días para familia extendida
    };
  };
  approvalWorkflow: {
    levels: Array<{
      level: number;
      approverRole: string;
      approverDepartment?: string;
      required: boolean;
    }>;
    autoApprove: {
      enabled: boolean;
      maxDays: number;
      conditions?: string[];
    };
  };
  isActive: boolean;
  effectiveDate: Date;
  endDate?: Date;
  applicableTo: {
    departments?: string[];
    positions?: string[];
    employeeIds?: string[];
    allEmployees: boolean;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para solicitud de ausencia
const absenceRequestSchema = new Schema<IAbsenceRequest>({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  businessId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['vacation', 'sick_leave', 'personal_leave', 'maternity_leave', 'paternity_leave', 'bereavement_leave', 'jury_duty', 'military_leave', 'unpaid_leave', 'other'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  requestedBy: {
    type: String,
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: {
    type: String,
    trim: true
  },
  documents: [{
    filename: String,
    originalName: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  coverage: {
    assignedTo: String,
    notes: String
  }
}, {
  timestamps: true
});

// Schema para balance de ausencias
const absenceBalanceSchema = new Schema<IAbsenceBalance>({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  businessId: {
    type: String,
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  balances: {
    vacation: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      used: {
        type: Number,
        default: 0,
        min: 0
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0
      },
      accrued: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    sickLeave: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      used: {
        type: Number,
        default: 0,
        min: 0
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    personalLeave: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      used: {
        type: Number,
        default: 0,
        min: 0
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    maternityLeave: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      used: {
        type: Number,
        default: 0,
        min: 0
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    paternityLeave: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      used: {
        type: Number,
        default: 0,
        min: 0
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    other: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      used: {
        type: Number,
        default: 0,
        min: 0
      },
      remaining: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema para políticas de ausencia
const absencePolicySchema = new Schema<IAbsencePolicy>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  policies: {
    vacation: {
      enabled: {
        type: Boolean,
        default: true
      },
      accrualRate: {
        type: Number,
        default: 1.25, // 15 días por año = 1.25 por mes
        min: 0
      },
      maxAccrual: {
        type: Number,
        default: 30,
        min: 0
      },
      minRequestDays: {
        type: Number,
        default: 1,
        min: 0
      },
      maxRequestDays: {
        type: Number,
        default: 15,
        min: 0
      },
      advanceNotice: {
        type: Number,
        default: 7,
        min: 0
      },
      blackoutPeriods: [{
        startDate: Date,
        endDate: Date,
        reason: String
      }]
    },
    sickLeave: {
      enabled: {
        type: Boolean,
        default: true
      },
      totalDays: {
        type: Number,
        default: 12,
        min: 0
      },
      requireDocumentation: {
        type: Boolean,
        default: true
      },
      maxConsecutiveDays: {
        type: Number,
        default: 5,
        min: 0
      }
    },
    personalLeave: {
      enabled: {
        type: Boolean,
        default: true
      },
      totalDays: {
        type: Number,
        default: 3,
        min: 0
      },
      requireApproval: {
        type: Boolean,
        default: true
      },
      advanceNotice: {
        type: Number,
        default: 3,
        min: 0
      }
    },
    maternityLeave: {
      enabled: {
        type: Boolean,
        default: true
      },
      totalDays: {
        type: Number,
        default: 90,
        min: 0
      },
      requireDocumentation: {
        type: Boolean,
        default: true
      },
      startBeforeDueDate: {
        type: Number,
        default: 15,
        min: 0
      }
    },
    paternityLeave: {
      enabled: {
        type: Boolean,
        default: true
      },
      totalDays: {
        type: Number,
        default: 15,
        min: 0
      },
      requireDocumentation: {
        type: Boolean,
        default: true
      }
    },
    bereavementLeave: {
      enabled: {
        type: Boolean,
        default: true
      },
      immediateFamily: {
        type: Number,
        default: 5,
        min: 0
      },
      extendedFamily: {
        type: Number,
        default: 2,
        min: 0
      }
    }
  },
  approvalWorkflow: {
    levels: [{
      level: {
        type: Number,
        required: true
      },
      approverRole: {
        type: String,
        required: true
      },
      approverDepartment: String,
      required: {
        type: Boolean,
        default: true
      }
    }],
    autoApprove: {
      enabled: {
        type: Boolean,
        default: false
      },
      maxDays: {
        type: Number,
        default: 1,
        min: 0
      },
      conditions: [String]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  applicableTo: {
    departments: [String],
    positions: [String],
    employeeIds: [String],
    allEmployees: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
absenceRequestSchema.index({ businessId: 1, employeeId: 1, startDate: 1, endDate: 1 });
absenceRequestSchema.index({ businessId: 1, status: 1 });
absenceRequestSchema.index({ businessId: 1, type: 1 });
absenceRequestSchema.index({ businessId: 1, requestedAt: -1 });

absenceBalanceSchema.index({ businessId: 1, employeeId: 1, year: 1 }, { unique: true });
absenceBalanceSchema.index({ businessId: 1, year: 1 });

absencePolicySchema.index({ businessId: 1, isActive: 1 });
absencePolicySchema.index({ businessId: 1, effectiveDate: 1, endDate: 1 });

// Métodos de instancia
absenceRequestSchema.methods.calculateTotalDays = function() {
  if (this.isHalfDay) {
    this.totalDays = 0.5;
  } else {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const timeDiff = end.getTime() - start.getTime();
    this.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días
  }
};

absenceRequestSchema.methods.approve = function(approvedBy: string, notes?: string) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
};

absenceRequestSchema.methods.reject = function(rejectedBy: string, reason: string) {
  this.status = 'rejected';
  this.approvedBy = rejectedBy;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
};

absenceRequestSchema.methods.cancel = function() {
  this.status = 'cancelled';
};

// Métodos estáticos
absenceRequestSchema.statics.getEmployeeRequests = async function(
  businessId: string,
  employeeId: string,
  year?: number
) {
  const query: any = { businessId, employeeId };
  if (year) {
    query.startDate = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    };
  }
  return this.find(query).sort({ startDate: -1 });
};

absenceRequestSchema.statics.getPendingRequests = async function(businessId: string) {
  return this.find({ businessId, status: 'pending' }).sort({ requestedAt: -1 });
};

absenceBalanceSchema.statics.getEmployeeBalance = async function(
  businessId: string,
  employeeId: string,
  year: number
) {
  let balance = await this.findOne({ businessId, employeeId, year });
  
  if (!balance) {
    // Crear balance inicial si no existe
    balance = new this({
      businessId,
      employeeId,
      year,
      balances: {
        vacation: { total: 15, used: 0, remaining: 15, accrued: 0 },
        sickLeave: { total: 12, used: 0, remaining: 12 },
        personalLeave: { total: 3, used: 0, remaining: 3 },
        maternityLeave: { total: 90, used: 0, remaining: 90 },
        paternityLeave: { total: 15, used: 0, remaining: 15 },
        other: { total: 0, used: 0, remaining: 0 }
      }
    });
    await balance.save();
  }
  
  return balance;
};

absenceBalanceSchema.statics.updateBalance = async function(
  businessId: string,
  employeeId: string,
  year: number,
  absenceType: string,
  daysUsed: number
) {
  const balance = await this.getEmployeeBalance(businessId, employeeId, year);
  
  if (balance.balances[absenceType as keyof typeof balance.balances]) {
    const typeBalance = balance.balances[absenceType as keyof typeof balance.balances];
    typeBalance.used += daysUsed;
    typeBalance.remaining = Math.max(0, typeBalance.total - typeBalance.used);
    balance.lastUpdated = new Date();
    await balance.save();
  }
  
  return balance;
};

export const AbsenceRequest = mongoose.model<IAbsenceRequest>('AbsenceRequest', absenceRequestSchema);
export const AbsenceBalance = mongoose.model<IAbsenceBalance>('AbsenceBalance', absenceBalanceSchema);
export const AbsencePolicy = mongoose.model<IAbsencePolicy>('AbsencePolicy', absencePolicySchema);
