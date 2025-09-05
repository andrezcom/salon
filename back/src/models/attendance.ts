import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para el sistema de asistencia
export interface IAttendanceRecord {
  employeeId: string;
  businessId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  status: 'present' | 'absent' | 'late' | 'early_departure' | 'partial' | 'holiday' | 'vacation' | 'sick_leave' | 'permission';
  notes?: string;
  location?: {
    type: 'office' | 'remote' | 'field';
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    address?: string;
  };
  deviceInfo?: {
    deviceId: string;
    deviceType: 'biometric' | 'mobile' | 'web' | 'card';
    ipAddress?: string;
    userAgent?: string;
  };
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceSummary {
  employeeId: string;
  businessId: string;
  period: {
    startDate: Date;
    endDate: Date;
    periodType: 'weekly' | 'biweekly' | 'monthly';
  };
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  attendanceRate: number;
  punctualityRate: number;
  summary: {
    totalWorkingDays: number;
    totalAbsences: number;
    totalLates: number;
    totalOvertime: number;
    totalBreaks: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceRule {
  businessId: string;
  name: string;
  description: string;
  rules: {
    workingHours: {
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      breakDuration: number; // minutes
      workingDays: number[]; // 0-6 (Sunday-Saturday)
    };
    overtime: {
      enabled: boolean;
      threshold: number; // hours after which overtime starts
      rate: number; // multiplier (1.5, 2.0, etc.)
      maxDailyHours: number;
    };
    latePolicy: {
      gracePeriod: number; // minutes
      maxLatesPerMonth: number;
      penaltyAfterMax: boolean;
    };
    absencePolicy: {
      maxAbsencesPerMonth: number;
      requireApproval: boolean;
      penaltyAfterMax: boolean;
    };
  };
  isActive: boolean;
  applicableTo: {
    departments?: string[];
    positions?: string[];
    employeeIds?: string[];
    allEmployees: boolean;
  };
  effectiveDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para registro de asistencia
const attendanceRecordSchema = new Schema<IAttendanceRecord>({
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
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  breakStart: {
    type: Date
  },
  breakEnd: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  regularHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  breakHours: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early_departure', 'partial', 'holiday', 'vacation', 'sick_leave', 'permission'],
    default: 'absent'
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['office', 'remote', 'field']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  deviceInfo: {
    deviceId: String,
    deviceType: {
      type: String,
      enum: ['biometric', 'mobile', 'web', 'card']
    },
    ipAddress: String,
    userAgent: String
  },
  approvedBy: String,
  approvedAt: Date
}, {
  timestamps: true
});

// Schema para resumen de asistencia
const attendanceSummarySchema = new Schema<IAttendanceSummary>({
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
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    periodType: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      required: true
    }
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0
  },
  presentDays: {
    type: Number,
    required: true,
    min: 0
  },
  absentDays: {
    type: Number,
    required: true,
    min: 0
  },
  lateDays: {
    type: Number,
    required: true,
    min: 0
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0
  },
  regularHours: {
    type: Number,
    required: true,
    min: 0
  },
  overtimeHours: {
    type: Number,
    required: true,
    min: 0
  },
  averageHoursPerDay: {
    type: Number,
    required: true,
    min: 0
  },
  attendanceRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  punctualityRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  summary: {
    totalWorkingDays: {
      type: Number,
      required: true,
      min: 0
    },
    totalAbsences: {
      type: Number,
      required: true,
      min: 0
    },
    totalLates: {
      type: Number,
      required: true,
      min: 0
    },
    totalOvertime: {
      type: Number,
      required: true,
      min: 0
    },
    totalBreaks: {
      type: Number,
      required: true,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Schema para reglas de asistencia
const attendanceRuleSchema = new Schema<IAttendanceRule>({
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
  rules: {
    workingHours: {
      startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      breakDuration: {
        type: Number,
        default: 60,
        min: 0
      },
      workingDays: [{
        type: Number,
        min: 0,
        max: 6
      }]
    },
    overtime: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 8,
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
      }
    },
    latePolicy: {
      gracePeriod: {
        type: Number,
        default: 15,
        min: 0
      },
      maxLatesPerMonth: {
        type: Number,
        default: 3,
        min: 0
      },
      penaltyAfterMax: {
        type: Boolean,
        default: false
      }
    },
    absencePolicy: {
      maxAbsencesPerMonth: {
        type: Number,
        default: 2,
        min: 0
      },
      requireApproval: {
        type: Boolean,
        default: true
      },
      penaltyAfterMax: {
        type: Boolean,
        default: false
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableTo: {
    departments: [String],
    positions: [String],
    employeeIds: [String],
    allEmployees: {
      type: Boolean,
      default: false
    }
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
attendanceRecordSchema.index({ businessId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ businessId: 1, date: 1 });
attendanceRecordSchema.index({ businessId: 1, status: 1 });

attendanceSummarySchema.index({ businessId: 1, employeeId: 1, 'period.startDate': 1, 'period.endDate': 1 }, { unique: true });
attendanceSummarySchema.index({ businessId: 1, 'period.startDate': 1, 'period.endDate': 1 });

attendanceRuleSchema.index({ businessId: 1, isActive: 1 });
attendanceRuleSchema.index({ businessId: 1, effectiveDate: 1, endDate: 1 });

// Métodos de instancia para AttendanceRecord
attendanceRecordSchema.methods.calculateHours = function() {
  if (!this.checkIn || !this.checkOut) {
    this.totalHours = 0;
    this.regularHours = 0;
    this.overtimeHours = 0;
    return;
  }

  const checkInTime = new Date(this.checkIn);
  const checkOutTime = new Date(this.checkOut);
  const breakTime = this.breakHours || 0;

  // Calcular horas totales
  const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
  this.totalHours = Math.max(0, (totalMinutes - breakTime) / 60);

  // Calcular horas regulares y extras (asumiendo 8 horas regulares)
  const regularHoursLimit = 8;
  this.regularHours = Math.min(this.totalHours, regularHoursLimit);
  this.overtimeHours = Math.max(0, this.totalHours - regularHoursLimit);
};

attendanceRecordSchema.methods.checkIn = function(deviceInfo?: any, location?: any) {
  this.checkIn = new Date();
  this.status = 'present';
  if (deviceInfo) this.deviceInfo = deviceInfo;
  if (location) this.location = location;
  this.calculateHours();
};

attendanceRecordSchema.methods.checkOut = function(deviceInfo?: any) {
  this.checkOut = new Date();
  if (deviceInfo) this.deviceInfo = { ...this.deviceInfo, ...deviceInfo };
  this.calculateHours();
};

attendanceRecordSchema.methods.startBreak = function() {
  this.breakStart = new Date();
};

attendanceRecordSchema.methods.endBreak = function() {
  if (this.breakStart) {
    this.breakEnd = new Date();
    const breakMinutes = (this.breakEnd.getTime() - this.breakStart.getTime()) / (1000 * 60);
    this.breakHours = (this.breakHours || 0) + (breakMinutes / 60);
    this.calculateHours();
  }
};

// Métodos estáticos
attendanceRecordSchema.statics.getEmployeeAttendance = async function(
  businessId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    businessId,
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

attendanceRecordSchema.statics.generateSummary = async function(
  businessId: string,
  employeeId: string,
  period: { startDate: Date; endDate: Date; periodType: string }
) {
  const records = await this.getEmployeeAttendance(businessId, employeeId, period.startDate, period.endDate);
  
  const summary = {
    totalDays: records.length,
    presentDays: records.filter(r => r.status === 'present').length,
    absentDays: records.filter(r => r.status === 'absent').length,
    lateDays: records.filter(r => r.status === 'late').length,
    totalHours: records.reduce((sum, r) => sum + r.totalHours, 0),
    regularHours: records.reduce((sum, r) => sum + r.regularHours, 0),
    overtimeHours: records.reduce((sum, r) => sum + r.overtimeHours, 0),
    averageHoursPerDay: 0,
    attendanceRate: 0,
    punctualityRate: 0
  };

  if (summary.totalDays > 0) {
    summary.averageHoursPerDay = summary.totalHours / summary.totalDays;
    summary.attendanceRate = (summary.presentDays / summary.totalDays) * 100;
    summary.punctualityRate = ((summary.presentDays - summary.lateDays) / summary.totalDays) * 100;
  }

  return summary;
};

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
export const AttendanceSummary = mongoose.model<IAttendanceSummary>('AttendanceSummary', attendanceSummarySchema);
export const AttendanceRule = mongoose.model<IAttendanceRule>('AttendanceRule', attendanceRuleSchema);
