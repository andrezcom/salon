import { Schema, model, Document } from "mongoose";

// Definir tipos de roles
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'expert' | 'viewer';

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
    { module: 'reports', actions: ['read'] },
    { module: 'settings', actions: ['read'] }
  ]
};

export interface IUser extends Document {
  nameUser: string;
  email: string;
  pass: string;
  role: UserRole;
  permissions?: IPermission[];
  active: boolean;
  businesses: Schema.Types.ObjectId[];
  defaultBusiness?: Schema.Types.ObjectId;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    address?: string;
    city?: string;
    country?: string;
  };
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
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  hasPermission(module: string, action: string): boolean;
  isLocked(): boolean;
  incLoginAttempts(): Promise<IUser>;
  resetLoginAttempts(): Promise<IUser>;
  getFullName(): string;
  isActive(): boolean;
}

const userSchema = new Schema<IUser>({
  nameUser: {
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
  pass: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'cashier', 'expert', 'viewer'],
    default: 'viewer',
    required: true
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
  active: {
    type: Boolean,
    default: true
  },
  businesses: [{
    type: Schema.Types.ObjectId,
    ref: 'Business'
  }],
  defaultBusiness: {
    type: Schema.Types.ObjectId,
    ref: 'Business'
  },
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'México'
    }
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
  }
}, {
  timestamps: true
});

// Métodos del modelo
userSchema.methods.hasPermission = function(module: string, action: string): boolean {
  // Si el usuario tiene permisos personalizados, usarlos
  if (this.permissions && this.permissions.length > 0) {
    const modulePermission = this.permissions.find(p => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  // Si no, usar los permisos del rol
  const rolePermissions = ROLE_PERMISSIONS[this.role];
  if (rolePermissions) {
    const modulePermission = rolePermissions.find(p => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  return false;
};

userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incLoginAttempts = function(): Promise<IUser> {
  // Si tenemos un lockUntil anterior y ya expiró, reiniciar
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    }).then(() => {
      this.lockUntil = undefined;
      this.loginAttempts = 1;
      return this;
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Si llegamos al máximo de intentos y no está bloqueado, bloquear
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 horas
  }
  
  return this.updateOne(updates).then(() => {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
    return this;
  });
};

userSchema.methods.resetLoginAttempts = function(): Promise<IUser> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  }).then(() => {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this;
  });
};

userSchema.methods.getFullName = function(): string {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.nameUser;
};

userSchema.methods.isActive = function(): boolean {
  return this.active && !this.isLocked();
};

// Métodos estáticos
userSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role, active: true });
};

userSchema.statics.findByBusiness = function(businessId: string) {
  return this.find({ businesses: businessId, active: true });
};

// Índices para mejorar el rendimiento
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });
userSchema.index({ businesses: 1 });
userSchema.index({ lastLogin: -1 });

export default model<IUser>('User', userSchema);