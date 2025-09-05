import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el sistema de beneficios y prestaciones
export interface IBenefit {
  _id: string;
  businessId: string;
  name: string;
  description: string;
  type: 'vacation' | 'sick_leave' | 'health_insurance' | 'dental_insurance' | 'vision_insurance' | 'life_insurance' | 'disability_insurance' | 'retirement_plan' | 'bonus' | 'commission' | 'transportation' | 'meal_allowance' | 'education' | 'gym_membership' | 'phone_allowance' | 'laptop_allowance' | 'other';
  category: 'time_off' | 'insurance' | 'financial' | 'lifestyle' | 'professional_development';
  value: {
    type: 'fixed' | 'percentage' | 'variable';
    amount?: number;
    percentage?: number;
    calculationMethod?: string;
  };
  eligibility: {
    employeeTypes: ('user' | 'expert')[];
    departments?: string[];
    positions?: string[];
    minTenure?: number; // meses
    maxTenure?: number; // meses
    salaryRange?: {
      min: number;
      max: number;
    };
    performanceRating?: number;
  };
  accrual: {
    enabled: boolean;
    rate: number; // por mes
    maxAccrual?: number;
    resetPeriod?: 'monthly' | 'quarterly' | 'yearly' | 'never';
  };
  usage: {
    maxUsage?: number;
    carryOver?: boolean;
    expirationDate?: Date;
    blackoutPeriods?: Array<{
      startDate: Date;
      endDate: Date;
      reason: string;
    }>;
  };
  cost: {
    employeeContribution: number; // porcentaje que paga el empleado
    employerContribution: number; // porcentaje que paga el empleador
    fixedCost?: number; // costo fijo mensual
  };
  isActive: boolean;
  effectiveDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeBenefit {
  _id: string;
  employeeId: string;
  businessId: string;
  benefitId: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  currentValue: number;
  accruedValue: number;
  usedValue: number;
  remainingValue: number;
  lastAccrualDate: Date;
  nextAccrualDate: Date;
  customSettings?: {
    contributionRate?: number;
    coverageLevel?: string;
    beneficiaries?: Array<{
      name: string;
      relationship: string;
      percentage: number;
    }>;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBenefitTransaction {
  _id: string;
  employeeId: string;
  businessId: string;
  benefitId: string;
  type: 'accrual' | 'usage' | 'adjustment' | 'expiration' | 'refund';
  amount: number;
  description: string;
  reference?: string; // referencia a solicitud, nómina, etc.
  transactionDate: Date;
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface IBenefitPolicy {
  _id: string;
  businessId: string;
  name: string;
  description: string;
  policies: {
    vacation: {
      accrualRate: number; // días por mes
      maxAccrual: number;
      carryOverLimit: number;
      blackoutPeriods: Array<{
        startDate: Date;
        endDate: Date;
        reason: string;
      }>;
    };
    sickLeave: {
      totalDays: number;
      accrualRate: number;
      requireDocumentation: boolean;
      maxConsecutiveDays: number;
    };
    healthInsurance: {
      coverageLevels: Array<{
        name: string;
        employeeContribution: number;
        employerContribution: number;
        coverage: string[];
      }>;
      waitingPeriod: number; // días
      enrollmentPeriod: string; // 'immediate' | 'monthly' | 'quarterly' | 'yearly'
    };
    retirement: {
      employerMatch: number; // porcentaje
      maxMatch: number; // porcentaje del salario
      vestingSchedule: Array<{
        years: number;
        percentage: number;
      }>;
    };
    bonuses: {
      types: Array<{
        name: string;
        calculationMethod: string;
        frequency: 'monthly' | 'quarterly' | 'yearly' | 'performance';
        eligibility: string[];
      }>;
    };
  };
  isActive: boolean;
  effectiveDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para beneficio
const benefitSchema = new Schema<IBenefit>({
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
  type: {
    type: String,
    enum: ['vacation', 'sick_leave', 'health_insurance', 'dental_insurance', 'vision_insurance', 'life_insurance', 'disability_insurance', 'retirement_plan', 'bonus', 'commission', 'transportation', 'meal_allowance', 'education', 'gym_membership', 'phone_allowance', 'laptop_allowance', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['time_off', 'insurance', 'financial', 'lifestyle', 'professional_development'],
    required: true
  },
  value: {
    type: {
      type: String,
      enum: ['fixed', 'percentage', 'variable'],
      required: true
    },
    amount: {
      type: Number,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    calculationMethod: String
  },
  eligibility: {
    employeeTypes: [{
      type: String,
      enum: ['user', 'expert']
    }],
    departments: [String],
    positions: [String],
    minTenure: {
      type: Number,
      min: 0
    },
    maxTenure: {
      type: Number,
      min: 0
    },
    salaryRange: {
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    },
    performanceRating: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  accrual: {
    enabled: {
      type: Boolean,
      default: false
    },
    rate: {
      type: Number,
      default: 0,
      min: 0
    },
    maxAccrual: {
      type: Number,
      min: 0
    },
    resetPeriod: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'never']
    }
  },
  usage: {
    maxUsage: {
      type: Number,
      min: 0
    },
    carryOver: {
      type: Boolean,
      default: false
    },
    expirationDate: Date,
    blackoutPeriods: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }]
  },
  cost: {
    employeeContribution: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    employerContribution: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    fixedCost: {
      type: Number,
      min: 0
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
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Schema para beneficio del empleado
const employeeBenefitSchema = new Schema<IEmployeeBenefit>({
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
  benefitId: {
    type: String,
    required: true,
    index: true
  },
  enrollmentDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active'
  },
  currentValue: {
    type: Number,
    default: 0,
    min: 0
  },
  accruedValue: {
    type: Number,
    default: 0,
    min: 0
  },
  usedValue: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAccrualDate: {
    type: Date,
    default: Date.now
  },
  nextAccrualDate: {
    type: Date,
    default: Date.now
  },
  customSettings: {
    contributionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    coverageLevel: String,
    beneficiaries: [{
      name: String,
      relationship: String,
      percentage: {
        type: Number,
        min: 0,
        max: 100
      }
    }]
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Schema para transacción de beneficio
const benefitTransactionSchema = new Schema<IBenefitTransaction>({
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
  benefitId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['accrual', 'usage', 'adjustment', 'expiration', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  reference: String,
  transactionDate: {
    type: Date,
    required: true
  },
  processedBy: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Schema para política de beneficios
const benefitPolicySchema = new Schema<IBenefitPolicy>({
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
      accrualRate: {
        type: Number,
        default: 1.25,
        min: 0
      },
      maxAccrual: {
        type: Number,
        default: 30,
        min: 0
      },
      carryOverLimit: {
        type: Number,
        default: 5,
        min: 0
      },
      blackoutPeriods: [{
        startDate: Date,
        endDate: Date,
        reason: String
      }]
    },
    sickLeave: {
      totalDays: {
        type: Number,
        default: 12,
        min: 0
      },
      accrualRate: {
        type: Number,
        default: 1,
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
    healthInsurance: {
      coverageLevels: [{
        name: String,
        employeeContribution: {
          type: Number,
          min: 0,
          max: 100
        },
        employerContribution: {
          type: Number,
          min: 0,
          max: 100
        },
        coverage: [String]
      }],
      waitingPeriod: {
        type: Number,
        default: 30,
        min: 0
      },
      enrollmentPeriod: {
        type: String,
        enum: ['immediate', 'monthly', 'quarterly', 'yearly'],
        default: 'monthly'
      }
    },
    retirement: {
      employerMatch: {
        type: Number,
        default: 3,
        min: 0,
        max: 100
      },
      maxMatch: {
        type: Number,
        default: 6,
        min: 0,
        max: 100
      },
      vestingSchedule: [{
        years: {
          type: Number,
          min: 0
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100
        }
      }]
    },
    bonuses: {
      types: [{
        name: String,
        calculationMethod: String,
        frequency: {
          type: String,
          enum: ['monthly', 'quarterly', 'yearly', 'performance']
        },
        eligibility: [String]
      }]
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
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
benefitSchema.index({ businessId: 1, isActive: 1 });
benefitSchema.index({ businessId: 1, type: 1 });
benefitSchema.index({ businessId: 1, category: 1 });

employeeBenefitSchema.index({ businessId: 1, employeeId: 1, benefitId: 1 }, { unique: true });
employeeBenefitSchema.index({ businessId: 1, employeeId: 1 });
employeeBenefitSchema.index({ businessId: 1, status: 1 });

benefitTransactionSchema.index({ businessId: 1, employeeId: 1, benefitId: 1 });
benefitTransactionSchema.index({ businessId: 1, transactionDate: -1 });
benefitTransactionSchema.index({ businessId: 1, type: 1 });

benefitPolicySchema.index({ businessId: 1, isActive: 1 });
benefitPolicySchema.index({ businessId: 1, effectiveDate: 1, endDate: 1 });

// Métodos de instancia
employeeBenefitSchema.methods.accrue = function(amount: number, processedBy: string) {
  this.accruedValue += amount;
  this.currentValue += amount;
  this.remainingValue += amount;
  this.lastAccrualDate = new Date();
  this.nextAccrualDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
};

employeeBenefitSchema.methods.use = function(amount: number, processedBy: string, reference?: string) {
  if (this.remainingValue >= amount) {
    this.usedValue += amount;
    this.remainingValue -= amount;
    this.currentValue -= amount;
    return true;
  }
  return false;
};

employeeBenefitSchema.methods.adjust = function(amount: number, processedBy: string, reason: string) {
  this.currentValue += amount;
  this.remainingValue += amount;
  if (amount < 0) {
    this.usedValue += Math.abs(amount);
  }
};

// Métodos estáticos
employeeBenefitSchema.statics.getEmployeeBenefits = async function(
  businessId: string,
  employeeId: string
) {
  return this.find({ businessId, employeeId, status: 'active' })
    .populate('benefitId', 'name type category value accrual usage cost');
};

employeeBenefitSchema.statics.enrollEmployee = async function(
  businessId: string,
  employeeId: string,
  benefitId: string,
  customSettings?: any
) {
  const existingEnrollment = await this.findOne({ businessId, employeeId, benefitId });
  if (existingEnrollment) {
    throw new Error('El empleado ya está inscrito en este beneficio');
  }

  const enrollment = new this({
    businessId,
    employeeId,
    benefitId,
    enrollmentDate: new Date(),
    customSettings
  });

  return enrollment.save();
};

benefitTransactionSchema.statics.createTransaction = async function(
  employeeId: string,
  businessId: string,
  benefitId: string,
  type: string,
  amount: number,
  description: string,
  processedBy: string,
  reference?: string
) {
  const transaction = new this({
    employeeId,
    businessId,
    benefitId,
    type,
    amount,
    description,
    reference,
    transactionDate: new Date(),
    processedBy
  });

  return transaction.save();
};

export const Benefit = mongoose.model<IBenefit>('Benefit', benefitSchema);
export const EmployeeBenefit = mongoose.model<IEmployeeBenefit>('EmployeeBenefit', employeeBenefitSchema);
export const BenefitTransaction = mongoose.model<IBenefitTransaction>('BenefitTransaction', benefitTransactionSchema);
export const BenefitPolicy = mongoose.model<IBenefitPolicy>('BenefitPolicy', benefitPolicySchema);
