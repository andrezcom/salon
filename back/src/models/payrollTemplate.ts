import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para plantillas y configuraciones de nómina
export interface IPayrollTemplate {
  _id: string;
  businessId: string;
  name: string;
  description: string;
  type: 'standard' | 'executive' | 'hourly' | 'commission' | 'contract' | 'intern' | 'custom';
  category: 'employee' | 'expert' | 'manager' | 'all';
  isDefault: boolean;
  isActive: boolean;
  template: {
    salaryStructure: {
      baseSalary: {
        enabled: boolean;
        type: 'monthly' | 'hourly' | 'daily';
        amount: number;
        calculationMethod?: string;
      };
      bonuses: Array<{
        name: string;
        type: 'fixed' | 'percentage' | 'performance';
        amount: number;
        conditions?: string[];
        frequency: 'monthly' | 'quarterly' | 'yearly' | 'performance';
      }>;
      commissions: Array<{
        name: string;
        type: 'service' | 'retail' | 'sales';
        rate: number;
        calculationMethod: string;
        minimumThreshold?: number;
        maximumCap?: number;
      }>;
      allowances: Array<{
        name: string;
        type: 'transport' | 'meal' | 'housing' | 'phone' | 'laptop' | 'other';
        amount: number;
        frequency: 'monthly' | 'daily' | 'per_use';
        taxable: boolean;
      }>;
    };
    deductions: {
      taxWithholding: {
        enabled: boolean;
        rate: number;
        method: 'percentage' | 'bracket' | 'fixed';
        brackets?: Array<{
          min: number;
          max: number;
          rate: number;
        }>;
      };
      socialSecurity: {
        enabled: boolean;
        employeeRate: number;
        employerRate: number;
        maxContribution?: number;
      };
      healthInsurance: {
        enabled: boolean;
        employeeRate: number;
        employerRate: number;
        coverage: string;
      };
      pension: {
        enabled: boolean;
        employeeRate: number;
        employerRate: number;
        maxContribution?: number;
      };
      other: Array<{
        name: string;
        type: 'fixed' | 'percentage';
        amount: number;
        frequency: 'monthly' | 'per_payroll';
        description: string;
      }>;
    };
    benefits: Array<{
      benefitId: string;
      name: string;
      type: string;
      employeeContribution: number;
      employerContribution: number;
      enrollmentRequired: boolean;
    }>;
    overtime: {
      enabled: boolean;
      rate: number;
      threshold: number; // horas después de las cuales aplica
      maxDailyHours: number;
      maxWeeklyHours: number;
      calculationMethod: 'daily' | 'weekly' | 'cumulative';
    };
    attendance: {
      workingDays: number[]; // 0-6 (domingo-sábado)
      workingHours: {
        start: string; // HH:MM
        end: string;   // HH:MM
        breakDuration: number; // minutos
      };
      gracePeriod: number; // minutos de tolerancia
      latePenalty: {
        enabled: boolean;
        amount: number;
        maxPenalties: number;
      };
    };
  };
  applicableTo: {
    departments?: string[];
    positions?: string[];
    employeeTypes?: ('user' | 'expert')[];
    salaryRanges?: Array<{
      min: number;
      max: number;
    }>;
    tenureRanges?: Array<{
      min: number; // meses
      max: number; // meses
    }>;
  };
  effectiveDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayrollConfiguration {
  _id: string;
  businessId: string;
  name: string;
  description: string;
  settings: {
    payrollPeriod: {
      type: 'weekly' | 'biweekly' | 'monthly';
      startDay: number; // 0-6 (domingo-sábado)
      payDay: number; // días después del final del período
      cutoffDay: number; // día del mes para corte mensual
    };
    calculation: {
      roundingMethod: 'round' | 'floor' | 'ceiling';
      decimalPlaces: number;
      currency: string;
      locale: string;
    };
    overtime: {
      enabled: boolean;
      dailyThreshold: number;
      weeklyThreshold: number;
      rate: number;
      maxDailyHours: number;
      maxWeeklyHours: number;
    };
    attendance: {
      trackingMethod: 'manual' | 'automatic' | 'hybrid';
      gracePeriod: number;
      latePenalty: number;
      absencePenalty: number;
      requireApproval: boolean;
    };
    benefits: {
      accrualMethod: 'monthly' | 'payroll' | 'annual';
      carryOverEnabled: boolean;
      maxCarryOver: number;
      expirationPolicy: 'none' | 'annual' | 'custom';
    };
    reporting: {
      generateReports: boolean;
      reportTypes: string[];
      exportFormats: ('pdf' | 'excel' | 'csv')[];
      retentionPeriod: number; // días
    };
    notifications: {
      enabled: boolean;
      payrollReminders: boolean;
      approvalReminders: boolean;
      reportNotifications: boolean;
      emailRecipients: string[];
    };
    integration: {
      accountingSystem: string;
      bankIntegration: boolean;
      timeTrackingSystem: string;
      hrSystem: string;
    };
  };
  isActive: boolean;
  effectiveDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayrollSchedule {
  _id: string;
  businessId: string;
  year: number;
  periods: Array<{
    periodNumber: number;
    startDate: Date;
    endDate: Date;
    payDate: Date;
    status: 'upcoming' | 'current' | 'processing' | 'completed' | 'cancelled';
    payrollCount: number;
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    processedAt?: Date;
    processedBy?: string;
  }>;
  holidays: Array<{
    date: Date;
    name: string;
    type: 'national' | 'regional' | 'company';
    isWorkingDay: boolean;
  }>;
  specialPeriods: Array<{
    name: string;
    startDate: Date;
    endDate: Date;
    type: 'bonus' | 'adjustment' | 'special_payment';
    description: string;
  }>;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para plantilla de nómina
const payrollTemplateSchema = new Schema<IPayrollTemplate>({
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
    enum: ['standard', 'executive', 'hourly', 'commission', 'contract', 'intern', 'custom'],
    required: true
  },
  category: {
    type: String,
    enum: ['employee', 'expert', 'manager', 'all'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  template: {
    salaryStructure: {
      baseSalary: {
        enabled: {
          type: Boolean,
          default: true
        },
        type: {
          type: String,
          enum: ['monthly', 'hourly', 'daily'],
          default: 'monthly'
        },
        amount: {
          type: Number,
          default: 0,
          min: 0
        },
        calculationMethod: String
      },
      bonuses: [{
        name: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['fixed', 'percentage', 'performance'],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        conditions: [String],
        frequency: {
          type: String,
          enum: ['monthly', 'quarterly', 'yearly', 'performance'],
          default: 'monthly'
        }
      }],
      commissions: [{
        name: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['service', 'retail', 'sales'],
          required: true
        },
        rate: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        },
        calculationMethod: {
          type: String,
          required: true
        },
        minimumThreshold: {
          type: Number,
          min: 0
        },
        maximumCap: {
          type: Number,
          min: 0
        }
      }],
      allowances: [{
        name: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['transport', 'meal', 'housing', 'phone', 'laptop', 'other'],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        frequency: {
          type: String,
          enum: ['monthly', 'daily', 'per_use'],
          default: 'monthly'
        },
        taxable: {
          type: Boolean,
          default: true
        }
      }]
    },
    deductions: {
      taxWithholding: {
        enabled: {
          type: Boolean,
          default: true
        },
        rate: {
          type: Number,
          default: 10,
          min: 0,
          max: 100
        },
        method: {
          type: String,
          enum: ['percentage', 'bracket', 'fixed'],
          default: 'percentage'
        },
        brackets: [{
          min: {
            type: Number,
            min: 0
          },
          max: {
            type: Number,
            min: 0
          },
          rate: {
            type: Number,
            min: 0,
            max: 100
          }
        }]
      },
      socialSecurity: {
        enabled: {
          type: Boolean,
          default: true
        },
        employeeRate: {
          type: Number,
          default: 4,
          min: 0,
          max: 100
        },
        employerRate: {
          type: Number,
          default: 8.5,
          min: 0,
          max: 100
        },
        maxContribution: {
          type: Number,
          min: 0
        }
      },
      healthInsurance: {
        enabled: {
          type: Boolean,
          default: true
        },
        employeeRate: {
          type: Number,
          default: 4,
          min: 0,
          max: 100
        },
        employerRate: {
          type: Number,
          default: 8.5,
          min: 0,
          max: 100
        },
        coverage: {
          type: String,
          default: 'standard'
        }
      },
      pension: {
        enabled: {
          type: Boolean,
          default: true
        },
        employeeRate: {
          type: Number,
          default: 4,
          min: 0,
          max: 100
        },
        employerRate: {
          type: Number,
          default: 12,
          min: 0,
          max: 100
        },
        maxContribution: {
          type: Number,
          min: 0
        }
      },
      other: [{
        name: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['fixed', 'percentage'],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        frequency: {
          type: String,
          enum: ['monthly', 'per_payroll'],
          default: 'monthly'
        },
        description: String
      }]
    },
    benefits: [{
      benefitId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
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
      enrollmentRequired: {
        type: Boolean,
        default: false
      }
    }],
    overtime: {
      enabled: {
        type: Boolean,
        default: true
      },
      rate: {
        type: Number,
        default: 1.5,
        min: 1
      },
      threshold: {
        type: Number,
        default: 8,
        min: 0
      },
      maxDailyHours: {
        type: Number,
        default: 12,
        min: 0
      },
      maxWeeklyHours: {
        type: Number,
        default: 48,
        min: 0
      },
      calculationMethod: {
        type: String,
        enum: ['daily', 'weekly', 'cumulative'],
        default: 'daily'
      }
    },
    attendance: {
      workingDays: [{
        type: Number,
        min: 0,
        max: 6
      }],
      workingHours: {
        start: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        end: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        breakDuration: {
          type: Number,
          default: 60,
          min: 0
        }
      },
      gracePeriod: {
        type: Number,
        default: 15,
        min: 0
      },
      latePenalty: {
        enabled: {
          type: Boolean,
          default: false
        },
        amount: {
          type: Number,
          default: 0,
          min: 0
        },
        maxPenalties: {
          type: Number,
          default: 3,
          min: 0
        }
      }
    }
  },
  applicableTo: {
    departments: [String],
    positions: [String],
    employeeTypes: [{
      type: String,
      enum: ['user', 'expert']
    }],
    salaryRanges: [{
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    }],
    tenureRanges: [{
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    }]
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

// Schema para configuración de nómina
const payrollConfigurationSchema = new Schema<IPayrollConfiguration>({
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
  settings: {
    payrollPeriod: {
      type: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly'],
        required: true
      },
      startDay: {
        type: Number,
        min: 0,
        max: 6,
        default: 1
      },
      payDay: {
        type: Number,
        default: 5,
        min: 1,
        max: 30
      },
      cutoffDay: {
        type: Number,
        default: 30,
        min: 1,
        max: 31
      }
    },
    calculation: {
      roundingMethod: {
        type: String,
        enum: ['round', 'floor', 'ceiling'],
        default: 'round'
      },
      decimalPlaces: {
        type: Number,
        default: 2,
        min: 0,
        max: 4
      },
      currency: {
        type: String,
        default: 'COP'
      },
      locale: {
        type: String,
        default: 'es-CO'
      }
    },
    overtime: {
      enabled: {
        type: Boolean,
        default: true
      },
      dailyThreshold: {
        type: Number,
        default: 8,
        min: 0
      },
      weeklyThreshold: {
        type: Number,
        default: 40,
        min: 0
      },
      rate: {
        type: Number,
        default: 1.5,
        min: 1
      },
      maxDailyHours: {
        type: Number,
        default: 12,
        min: 0
      },
      maxWeeklyHours: {
        type: Number,
        default: 48,
        min: 0
      }
    },
    attendance: {
      trackingMethod: {
        type: String,
        enum: ['manual', 'automatic', 'hybrid'],
        default: 'manual'
      },
      gracePeriod: {
        type: Number,
        default: 15,
        min: 0
      },
      latePenalty: {
        type: Number,
        default: 0,
        min: 0
      },
      absencePenalty: {
        type: Number,
        default: 0,
        min: 0
      },
      requireApproval: {
        type: Boolean,
        default: true
      }
    },
    benefits: {
      accrualMethod: {
        type: String,
        enum: ['monthly', 'payroll', 'annual'],
        default: 'monthly'
      },
      carryOverEnabled: {
        type: Boolean,
        default: true
      },
      maxCarryOver: {
        type: Number,
        default: 5,
        min: 0
      },
      expirationPolicy: {
        type: String,
        enum: ['none', 'annual', 'custom'],
        default: 'annual'
      }
    },
    reporting: {
      generateReports: {
        type: Boolean,
        default: true
      },
      reportTypes: [String],
      exportFormats: [{
        type: String,
        enum: ['pdf', 'excel', 'csv']
      }],
      retentionPeriod: {
        type: Number,
        default: 2555, // 7 años
        min: 0
      }
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      payrollReminders: {
        type: Boolean,
        default: true
      },
      approvalReminders: {
        type: Boolean,
        default: true
      },
      reportNotifications: {
        type: Boolean,
        default: true
      },
      emailRecipients: [String]
    },
    integration: {
      accountingSystem: String,
      bankIntegration: {
        type: Boolean,
        default: false
      },
      timeTrackingSystem: String,
      hrSystem: String
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

// Schema para cronograma de nómina
const payrollScheduleSchema = new Schema<IPayrollSchedule>({
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
  periods: [{
    periodNumber: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    payDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['upcoming', 'current', 'processing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    payrollCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEmployees: {
      type: Number,
      default: 0,
      min: 0
    },
    totalGrossPay: {
      type: Number,
      default: 0,
      min: 0
    },
    totalNetPay: {
      type: Number,
      default: 0,
      min: 0
    },
    processedAt: Date,
    processedBy: String
  }],
  holidays: [{
    date: {
      type: Date,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['national', 'regional', 'company'],
      default: 'national'
    },
    isWorkingDay: {
      type: Boolean,
      default: false
    }
  }],
  specialPeriods: [{
    name: {
      type: String,
      required: true
    },
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
      enum: ['bonus', 'adjustment', 'special_payment'],
      required: true
    },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
payrollTemplateSchema.index({ businessId: 1, isActive: 1 });
payrollTemplateSchema.index({ businessId: 1, type: 1 });
payrollTemplateSchema.index({ businessId: 1, category: 1 });
payrollTemplateSchema.index({ businessId: 1, isDefault: 1 });

payrollConfigurationSchema.index({ businessId: 1, isActive: 1 });
payrollConfigurationSchema.index({ businessId: 1, effectiveDate: 1, endDate: 1 });

payrollScheduleSchema.index({ businessId: 1, year: 1 }, { unique: true });
payrollScheduleSchema.index({ businessId: 1, 'periods.status': 1 });

// Métodos estáticos
payrollTemplateSchema.statics.getDefaultTemplate = async function(
  businessId: string,
  category: string
) {
  return this.findOne({ businessId, category, isDefault: true, isActive: true });
};

payrollTemplateSchema.statics.getApplicableTemplates = async function(
  businessId: string,
  employeeData: any
) {
  const templates = await this.find({ businessId, isActive: true });
  
  return templates.filter(template => {
    const applicable = template.applicableTo;
    
    // Verificar tipo de empleado
    if (applicable.employeeTypes && applicable.employeeTypes.length > 0) {
      if (!applicable.employeeTypes.includes(employeeData.personType)) {
        return false;
      }
    }
    
    // Verificar departamento
    if (applicable.departments && applicable.departments.length > 0) {
      if (!applicable.departments.includes(employeeData.department)) {
        return false;
      }
    }
    
    // Verificar posición
    if (applicable.positions && applicable.positions.length > 0) {
      if (!applicable.positions.includes(employeeData.position)) {
        return false;
      }
    }
    
    // Verificar rango salarial
    if (applicable.salaryRanges && applicable.salaryRanges.length > 0) {
      const salary = employeeData.salary || 0;
      const inRange = applicable.salaryRanges.some(range => 
        salary >= range.min && salary <= range.max
      );
      if (!inRange) return false;
    }
    
    // Verificar antigüedad
    if (applicable.tenureRanges && applicable.tenureRanges.length > 0) {
      const tenure = employeeData.tenure || 0;
      const inRange = applicable.tenureRanges.some(range => 
        tenure >= range.min && tenure <= range.max
      );
      if (!inRange) return false;
    }
    
    return true;
  });
};

payrollScheduleSchema.statics.generateYearlySchedule = async function(
  businessId: string,
  year: number,
  configuration: any,
  createdBy: string
) {
  const schedule = new this({
    businessId,
    year,
    periods: [],
    holidays: [],
    specialPeriods: [],
    createdBy
  });
  
  // Generar períodos según configuración
  const periodType = configuration.settings.payrollPeriod.type;
  const payDay = configuration.settings.payrollPeriod.payDay;
  
  let periodNumber = 1;
  let currentDate = new Date(year, 0, 1);
  
  while (currentDate.getFullYear() === year) {
    let endDate: Date;
    
    switch (periodType) {
      case 'weekly':
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'biweekly':
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 13);
        break;
      case 'monthly':
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        break;
      default:
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 6);
    }
    
    const payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + payDay);
    
    schedule.periods.push({
      periodNumber,
      startDate: new Date(currentDate),
      endDate: new Date(endDate),
      payDate: new Date(payDate),
      status: 'upcoming'
    });
    
    currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1);
    periodNumber++;
  }
  
  return schedule.save();
};

export const PayrollTemplate = mongoose.model<IPayrollTemplate>('PayrollTemplate', payrollTemplateSchema);
export const PayrollConfiguration = mongoose.model<IPayrollConfiguration>('PayrollConfiguration', payrollConfigurationSchema);
export const PayrollSchedule = mongoose.model<IPayrollSchedule>('PayrollSchedule', payrollScheduleSchema);
