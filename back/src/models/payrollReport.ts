import mongoose, { Schema, Document } from 'mongoose';

// Interfaces para reportes de nómina
export interface IPayrollReportPeriod {
  startDate: Date;
  endDate: Date;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  year: number;
  month?: number;
  week?: number;
  quarter?: number;
}

export interface IPayrollReportSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalBenefits: number;
  averageSalary: number;
  totalOvertime: number;
  totalAbsences: number;
}

export interface IPayrollReportEmployee {
  employeeId: string;
  employeeName: string;
  department?: string;
  position?: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  benefits: number;
  overtime: number;
  absences: number;
  workingDays: number;
  totalHours: number;
}

export interface IPayrollReport extends Document {
  _id: string;
  businessId: string;
  reportType: 'period' | 'employee' | 'department' | 'summary' | 'custom';
  period: IPayrollReportPeriod;
  summary: IPayrollReportSummary;
  employees: IPayrollReportEmployee[];
  filters?: {
    departments?: string[];
    positions?: string[];
    salaryRange?: {
      min: number;
      max: number;
    };
    employeeIds?: string[];
  };
  generatedBy: string;
  generatedAt: Date;
  status: 'draft' | 'generated' | 'exported';
  exportHistory?: Array<{
    format: 'pdf' | 'excel' | 'csv';
    exportedAt: Date;
    exportedBy: string;
    filename: string;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para período de reporte
const payrollReportPeriodSchema = new Schema<IPayrollReportPeriod>({
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
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  week: {
    type: Number,
    min: 1,
    max: 53
  },
  quarter: {
    type: Number,
    min: 1,
    max: 4
  }
}, { _id: false });

// Schema para resumen de reporte
const payrollReportSummarySchema = new Schema<IPayrollReportSummary>({
  totalEmployees: {
    type: Number,
    required: true,
    min: 0
  },
  totalGrossPay: {
    type: Number,
    required: true,
    min: 0
  },
  totalDeductions: {
    type: Number,
    required: true,
    min: 0
  },
  totalNetPay: {
    type: Number,
    required: true,
    min: 0
  },
  totalBenefits: {
    type: Number,
    required: true,
    min: 0
  },
  averageSalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalOvertime: {
    type: Number,
    required: true,
    min: 0
  },
  totalAbsences: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Schema para empleado en reporte
const payrollReportEmployeeSchema = new Schema<IPayrollReportEmployee>({
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  position: {
    type: String
  },
  grossPay: {
    type: Number,
    required: true,
    min: 0
  },
  deductions: {
    type: Number,
    required: true,
    min: 0
  },
  netPay: {
    type: Number,
    required: true,
    min: 0
  },
  benefits: {
    type: Number,
    required: true,
    min: 0
  },
  overtime: {
    type: Number,
    required: true,
    min: 0
  },
  absences: {
    type: Number,
    required: true,
    min: 0
  },
  workingDays: {
    type: Number,
    required: true,
    min: 0
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Schema principal
const payrollReportSchema = new Schema<IPayrollReport>({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['period', 'employee', 'department', 'summary', 'custom'],
    required: true
  },
  period: {
    type: payrollReportPeriodSchema,
    required: true
  },
  summary: {
    type: payrollReportSummarySchema,
    required: true
  },
  employees: [payrollReportEmployeeSchema],
  filters: {
    departments: [String],
    positions: [String],
    salaryRange: {
      min: Number,
      max: Number
    },
    employeeIds: [String]
  },
  generatedBy: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'exported'],
    default: 'draft'
  },
  exportHistory: [{
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv']
    },
    exportedAt: {
      type: Date,
      default: Date.now
    },
    exportedBy: String,
    filename: String
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
payrollReportSchema.index({ businessId: 1, 'period.startDate': 1, 'period.endDate': 1 });
payrollReportSchema.index({ businessId: 1, reportType: 1 });
payrollReportSchema.index({ businessId: 1, generatedAt: -1 });

// Métodos estáticos
payrollReportSchema.statics.generatePeriodReport = async function(
  businessId: string,
  period: IPayrollReportPeriod,
  filters?: any,
  generatedBy: string
) {
  // Lógica para generar reporte por período
  // Se implementará en el controlador
};

payrollReportSchema.statics.exportToPDF = async function(reportId: string) {
  // Lógica para exportar a PDF
  // Se implementará con librerías como puppeteer o jsPDF
};

payrollReportSchema.statics.exportToExcel = async function(reportId: string) {
  // Lógica para exportar a Excel
  // Se implementará con librerías como exceljs
};

export default mongoose.model<IPayrollReport>('PayrollReport', payrollReportSchema);
