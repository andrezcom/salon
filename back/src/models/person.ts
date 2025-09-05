import mongoose, { Schema, Document } from "mongoose";

// Tipos de persona
export type PersonType = 'user' | 'expert' | 'client';

// Roles de usuario
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'expert' | 'viewer';

// Roles de experto
export type ExpertRole = {
  stylist: boolean;
  manicure: boolean;
  makeup: boolean;
};

// Definir permisos específicos
export interface IPermission {
  module: string;
  actions: string[];
}

// Definir roles con sus permisos
export const ROLE_PERMISSIONS: Record<UserRole, IPermission[]> = {
  super_admin: [
    { module: 'business', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'experts', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'sales', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'inventory', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'commissions', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'cash', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'expenses', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'payroll', actions: ['create', 'read', 'update', 'delete', 'approve', 'pay', 'manage'] },
    { module: 'suppliers', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'accountsPayable', actions: ['create', 'read', 'update', 'delete', 'pay', 'manage'] },
    { module: 'purchaseOrders', actions: ['create', 'read', 'update', 'delete', 'approve', 'manage'] },
    { module: 'loyalty', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'clientRetention', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'reports', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'settings', actions: ['create', 'read', 'update', 'delete', 'manage'] }
  ],
  admin: [
    { module: 'business', actions: ['read', 'update'] },
    { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'experts', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'sales', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'commissions', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'cash', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'payroll', actions: ['create', 'read', 'update', 'approve', 'pay'] },
    { module: 'attendance', actions: ['create', 'read', 'update', 'delete', 'approve'] },
    { module: 'absence', actions: ['create', 'read', 'update', 'delete', 'approve'] },
    { module: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'accountsPayable', actions: ['create', 'read', 'update', 'pay'] },
    { module: 'purchaseOrders', actions: ['create', 'read', 'update', 'approve'] },
    { module: 'loyalty', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'clientRetention', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'reports', actions: ['read'] },
    { module: 'settings', actions: ['read', 'update'] }
  ],
  manager: [
    { module: 'business', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'experts', actions: ['create', 'read', 'update'] },
    { module: 'sales', actions: ['create', 'read', 'update'] },
    { module: 'inventory', actions: ['create', 'read', 'update'] },
    { module: 'commissions', actions: ['read', 'update'] },
    { module: 'cash', actions: ['read', 'update'] },
    { module: 'expenses', actions: ['create', 'read', 'update'] },
    { module: 'payroll', actions: ['read'] },
    { module: 'attendance', actions: ['read', 'update'] },
    { module: 'absence', actions: ['read', 'approve'] },
    { module: 'suppliers', actions: ['read'] },
    { module: 'accountsPayable', actions: ['read'] },
    { module: 'purchaseOrders', actions: ['read'] },
    { module: 'loyalty', actions: ['read'] },
    { module: 'clientRetention', actions: ['read'] },
    { module: 'reports', actions: ['read'] },
    { module: 'settings', actions: ['read'] }
  ],
  cashier: [
    { module: 'business', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'experts', actions: ['read'] },
    { module: 'sales', actions: ['create', 'read', 'update'] },
    { module: 'inventory', actions: ['read'] },
    { module: 'commissions', actions: ['read'] },
    { module: 'cash', actions: ['create', 'read', 'update'] },
    { module: 'expenses', actions: ['read'] },
    { module: 'payroll', actions: ['read'] },
    { module: 'attendance', actions: ['read'] },
    { module: 'absence', actions: ['read'] },
    { module: 'reports', actions: ['read'] },
    { module: 'settings', actions: ['read'] }
  ],
  expert: [
    { module: 'business', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'experts', actions: ['read'] },
    { module: 'sales', actions: ['create', 'read'] },
    { module: 'inventory', actions: ['read'] },
    { module: 'commissions', actions: ['read'] },
    { module: 'cash', actions: ['read'] },
    { module: 'expenses', actions: ['read'] },
    { module: 'attendance', actions: ['read'] },
    { module: 'absence', actions: ['read'] },
    { module: 'reports', actions: ['read'] },
    { module: 'settings', actions: ['read'] }
  ],
  viewer: [
    { module: 'business', actions: ['read'] },
    { module: 'users', actions: ['read'] },
    { module: 'experts', actions: ['read'] },
    { module: 'sales', actions: ['read'] },
    { module: 'inventory', actions: ['read'] },
    { module: 'commissions', actions: ['read'] },
    { module: 'cash', actions: ['read'] },
    { module: 'expenses', actions: ['read'] },
    { module: 'attendance', actions: ['read'] },
    { module: 'absence', actions: ['read'] },
    { module: 'reports', actions: ['read'] },
    { module: 'settings', actions: ['read'] }
  ]
};

export interface IPerson extends Document {
  // Información básica
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phone2?: string;
  numberId?: string;
  
  // Tipo de persona
  personType: PersonType;
  
  // Información específica por tipo
  userInfo?: {
    password: string;
    role: UserRole;
    permissions?: IPermission[];
    businesses: Schema.Types.ObjectId[];
    defaultBusiness?: Schema.Types.ObjectId;
    settings?: {
      language: string;
      timezone: string;
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    };
    lastLogin?: Date;
    loginAttempts: number;
    lockUntil?: Date;
  };
  
  expertInfo?: {
    alias: string;
    role: ExpertRole;
    commissionSettings: {
      serviceCommission: number;
      retailCommission: number;
      serviceCalculationMethod: 'before_inputs' | 'after_inputs';
      minimumServiceCommission: number;
      maximumServiceCommission?: number;
    };
    businessId?: string;
    hireDate: Date;
    notes?: string;
  };
  
  clientInfo?: {
    // Información específica del cliente
    preferences?: {
      services: string[];
      communication: 'email' | 'phone' | 'sms';
      language: string;
    };
    loyaltyPoints?: number;
    totalSpent?: number;
    lastVisit?: Date;
    notes?: string;
  };
  
  // Información común
  profileImage?: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  };
  
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Estado y auditoría
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  hasPermission(module: string, action: string): boolean;
  isLocked(): boolean;
  incLoginAttempts(): Promise<IPerson>;
  resetLoginAttempts(): Promise<IPerson>;
  getFullName(): string;
  isActive(): boolean;
  setProfileImage(imageData: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
  }): Promise<IPerson>;
  removeProfileImage(): Promise<IPerson>;
  hasProfileImage(): boolean;
  getProfileImageUrl(): string | null;
}

const personSchema = new Schema<IPerson>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  phone2: {
    type: String,
    required: false,
    trim: true
  },
  numberId: {
    type: String,
    required: false,
    trim: true
  },
  personType: {
    type: String,
    enum: ['user', 'expert', 'client'],
    required: true
  },
  userInfo: {
    password: {
      type: String,
      required: false
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'manager', 'cashier', 'expert', 'viewer'],
      default: 'viewer',
      required: false
    },
    permissions: [{
      module: {
        type: String,
        required: true
      },
      actions: [{
        type: String,
        required: true
      }]
    }],
    businesses: [{
      type: Schema.Types.ObjectId,
      ref: 'Business'
    }],
    defaultBusiness: {
      type: Schema.Types.ObjectId,
      ref: 'Business'
    },
    settings: {
      language: {
        type: String,
        default: 'es'
      },
      timezone: {
        type: String,
        default: 'America/Mexico_City'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        push: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        }
      }
    },
    lastLogin: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    salarySettings: {
      salaryType: {
        type: String,
        enum: ['monthly', 'hourly', 'daily'],
        default: 'monthly'
      },
      monthlySalary: {
        type: Number,
        default: 0,
        min: 0
      },
      hourlyRate: {
        type: Number,
        default: 0,
        min: 0
      },
      dailyRate: {
        type: Number,
        default: 0,
        min: 0
      },
      transportSubsidy: {
        type: Number,
        default: 0,
        min: 0
      },
      overtimeRate: {
        type: Number,
        default: 1.5,
        min: 1
      },
      withholdings: {
        taxWithholding: {
          type: Boolean,
          default: false
        },
        taxRate: {
          type: Number,
          default: 0.1,
          min: 0,
          max: 1
        },
        socialSecurity: {
          type: Boolean,
          default: false
        },
        socialSecurityRate: {
          type: Number,
          default: 0.04,
          min: 0,
          max: 1
        },
        healthInsurance: {
          type: Boolean,
          default: false
        },
        healthInsuranceRate: {
          type: Number,
          default: 0.04,
          min: 0,
          max: 1
        }
      },
      position: {
        type: String,
        trim: true
      },
      department: {
        type: String,
        trim: true
      },
      hireDate: {
        type: Date
      },
      contractType: {
        type: String,
        enum: ['full_time', 'part_time', 'contract', 'intern'],
        default: 'full_time'
      }
    }
  },
  expertInfo: {
    alias: {
      type: String,
      required: false,
      trim: true
    },
    role: {
      stylist: {
        type: Boolean,
        default: false
      },
      manicure: {
        type: Boolean,
        default: false
      },
      makeup: {
        type: Boolean,
        default: false
      }
    },
    commissionSettings: {
      serviceCommission: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
        max: 100
      },
      retailCommission: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
        max: 100
      },
      serviceCalculationMethod: {
        type: String,
        enum: ['before_inputs', 'after_inputs'],
        default: 'before_inputs',
        required: false
      },
      minimumServiceCommission: {
        type: Number,
        required: false,
        default: 0,
        min: 0
      },
      maximumServiceCommission: {
        type: Number,
        required: false,
        min: 0
      }
    },
    businessId: {
      type: String,
      required: false
    },
    hireDate: {
      type: Date,
      default: Date.now,
      required: false
    },
    notes: {
      type: String,
      required: false
    }
  },
  clientInfo: {
    preferences: {
      services: [{
        type: String,
        required: false
      }],
      communication: {
        type: String,
        enum: ['email', 'phone', 'sms'],
        default: 'email',
        required: false
      },
      language: {
        type: String,
        default: 'es',
        required: false
      }
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    lastVisit: {
      type: Date
    },
    notes: {
      type: String,
      required: false
    }
  },
  profileImage: {
    url: {
      type: String,
      required: false,
      trim: true
    },
    filename: {
      type: String,
      required: false,
      trim: true
    },
    originalName: {
      type: String,
      required: false,
      trim: true
    },
    size: {
      type: Number,
      required: false,
      min: 0
    },
    mimeType: {
      type: String,
      required: false,
      trim: true
    },
    uploadedAt: {
      type: Date,
      required: false,
      default: Date.now
    }
  },
  address: {
    street: {
      type: String,
      required: false,
      trim: true
    },
    city: {
      type: String,
      required: false,
      trim: true
    },
    state: {
      type: String,
      required: false,
      trim: true
    },
    zipCode: {
      type: String,
      required: false,
      trim: true
    },
    country: {
      type: String,
      required: false,
      trim: true,
      default: 'México'
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Métodos del modelo
personSchema.methods.hasPermission = function(module: string, action: string): boolean {
  if (this.personType !== 'user' || !this.userInfo) {
    return false;
  }
  
  // Si el usuario tiene permisos personalizados, usarlos
  if (this.userInfo.permissions && this.userInfo.permissions.length > 0) {
    const modulePermission = this.userInfo.permissions.find((p: any) => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  // Si no, usar los permisos del rol
  const rolePermissions = ROLE_PERMISSIONS[this.userInfo.role as UserRole];
  if (rolePermissions) {
    const modulePermission = rolePermissions.find((p: IPermission) => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  return false;
};

personSchema.methods.isLocked = function(): boolean {
  if (this.personType !== 'user' || !this.userInfo) {
    return false;
  }
  return !!(this.userInfo.lockUntil && this.userInfo.lockUntil > new Date());
};

personSchema.methods.incLoginAttempts = function(): Promise<IPerson> {
  if (this.personType !== 'user' || !this.userInfo) {
    return Promise.resolve(this as any);
  }
  
  // Si tenemos un lockUntil anterior y ya expiró, reiniciar
  if (this.userInfo.lockUntil && this.userInfo.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { 'userInfo.lockUntil': 1 },
      $set: { 'userInfo.loginAttempts': 1 }
    }).then(() => {
      this.userInfo!.lockUntil = undefined;
      this.userInfo!.loginAttempts = 1;
      return this;
    });
  }
  
  const updates: any = { $inc: { 'userInfo.loginAttempts': 1 } };
  
  // Si llegamos al máximo de intentos y no está bloqueado, bloquear
  if (this.userInfo.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { 'userInfo.lockUntil': new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 horas
  }
  
  return this.updateOne(updates).then(() => {
    this.userInfo!.loginAttempts += 1;
    if (this.userInfo!.loginAttempts >= 5) {
      this.userInfo!.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
    return this;
  });
};

personSchema.methods.resetLoginAttempts = function(): Promise<IPerson> {
  if (this.personType !== 'user' || !this.userInfo) {
    return Promise.resolve(this as any);
  }
  
  return this.updateOne({
    $unset: { 'userInfo.loginAttempts': 1, 'userInfo.lockUntil': 1 }
  }).then(() => {
    this.userInfo!.loginAttempts = 0;
    this.userInfo!.lockUntil = undefined;
    return this;
  });
};

personSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

personSchema.methods.isActive = function(): boolean {
  return this.active && !this.isLocked();
};

personSchema.methods.setProfileImage = function(imageData: {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}) {
  this.profileImage = {
    ...imageData,
    uploadedAt: new Date()
  };
  return this.save();
};

personSchema.methods.removeProfileImage = function() {
  this.profileImage = undefined;
  return this.save();
};

personSchema.methods.hasProfileImage = function(): boolean {
  return !!(this.profileImage && this.profileImage.url);
};

personSchema.methods.getProfileImageUrl = function(): string | null {
  return this.profileImage?.url || null;
};

// Métodos estáticos
personSchema.statics.findByType = function(personType: PersonType) {
  return this.find({ personType, active: true });
};

personSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ 'userInfo.role': role, personType: 'user', active: true });
};

personSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ 
    $or: [
      { 'userInfo.businesses': businessId },
      { 'expertInfo.businessId': businessId }
    ],
    active: true 
  });
};

// Índices para mejorar el rendimiento
personSchema.index({ email: 1 });
personSchema.index({ personType: 1 });
personSchema.index({ active: 1 });
personSchema.index({ 'userInfo.role': 1 });
personSchema.index({ 'userInfo.businesses': 1 });
personSchema.index({ 'expertInfo.businessId': 1 });
personSchema.index({ 'userInfo.lastLogin': -1 });

export default mongoose.model<IPerson>('Person', personSchema);
