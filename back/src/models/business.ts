import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  databaseName: string;
  status: 'active' | 'inactive' | 'suspended';
  profileImage?: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  };
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    paletteName?: string;
    isCustom?: boolean;
    createdAt?: Date;
  };
  settings: {
    theme: string;
    currency: string;
    timezone: string;
    businessType: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  databaseName: {
    type: String,
    required: false, // Temporalmente false para permitir creación inicial
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
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
  colorPalette: {
    primary: {
      type: String,
      required: true,
      default: '#3B82F6',
      validate: {
        validator: function(v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Primary color must be a valid hex color'
      }
    },
    secondary: {
      type: String,
      required: true,
      default: '#10B981',
      validate: {
        validator: function(v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Secondary color must be a valid hex color'
      }
    },
    accent: {
      type: String,
      required: true,
      default: '#F59E0B',
      validate: {
        validator: function(v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Accent color must be a valid hex color'
      }
    },
    neutral: {
      type: String,
      required: true,
      default: '#6B7280',
      validate: {
        validator: function(v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Neutral color must be a valid hex color'
      }
    },
    paletteName: {
      type: String,
      required: false,
      trim: true,
      default: 'Professional Blue'
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    businessType: {
      type: String,
      default: 'salon'
    }
  },
  contact: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'México'
    }
  }
}, {
  timestamps: true
});

// Métodos del modelo
businessSchema.methods.setProfileImage = function(imageData: {
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

businessSchema.methods.removeProfileImage = function() {
  this.profileImage = undefined;
  return this.save();
};

businessSchema.methods.hasProfileImage = function(): boolean {
  return !!(this.profileImage && this.profileImage.url);
};

businessSchema.methods.getProfileImageUrl = function(): string | null {
  return this.profileImage?.url || null;
};

// Métodos para manejo de paletas de colores
businessSchema.methods.setColorPalette = function(palette: {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  paletteName?: string;
  isCustom?: boolean;
}) {
  this.colorPalette = {
    ...palette,
    isCustom: palette.isCustom || false,
    createdAt: new Date()
  };
  return this.save();
};

businessSchema.methods.getColorPalette = function() {
  return {
    primary: this.colorPalette.primary,
    secondary: this.colorPalette.secondary,
    accent: this.colorPalette.accent,
    neutral: this.colorPalette.neutral,
    paletteName: this.colorPalette.paletteName,
    isCustom: this.colorPalette.isCustom,
    createdAt: this.colorPalette.createdAt
  };
};

businessSchema.methods.resetToDefaultPalette = function() {
  this.colorPalette = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    neutral: '#6B7280',
    paletteName: 'Professional Blue',
    isCustom: false,
    createdAt: new Date()
  };
  return this.save();
};

// Métodos estáticos
businessSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ ownerId }).sort({ createdAt: -1 });
};

businessSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Métodos estáticos para paletas predeterminadas
businessSchema.statics.getDefaultPalettes = function() {
  return [
    {
      name: 'Professional Blue',
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      neutral: '#6B7280',
      description: 'Paleta profesional con azul como color principal'
    },
    {
      name: 'Elegant Purple',
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F97316',
      neutral: '#64748B',
      description: 'Paleta elegante con púrpura como color principal'
    },
    {
      name: 'Fresh Green',
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#EF4444',
      neutral: '#6B7280',
      description: 'Paleta fresca con verde como color principal'
    },
    {
      name: 'Warm Orange',
      primary: '#F59E0B',
      secondary: '#8B5CF6',
      accent: '#10B981',
      neutral: '#6B7280',
      description: 'Paleta cálida con naranja como color principal'
    },
    {
      name: 'Modern Red',
      primary: '#EF4444',
      secondary: '#3B82F6',
      accent: '#10B981',
      neutral: '#6B7280',
      description: 'Paleta moderna con rojo como color principal'
    },
    {
      name: 'Sophisticated Gray',
      primary: '#6B7280',
      secondary: '#3B82F6',
      accent: '#F59E0B',
      neutral: '#9CA3AF',
      description: 'Paleta sofisticada con gris como color principal'
    }
  ];
};

businessSchema.statics.applyDefaultPalette = function(businessId: string, paletteName: string) {
  const palettes = this.getDefaultPalettes();
  const selectedPalette = palettes.find(p => p.name === paletteName);
  
  if (!selectedPalette) {
    throw new Error(`Palette '${paletteName}' not found`);
  }
  
  return this.findByIdAndUpdate(
    businessId,
    {
      'colorPalette.primary': selectedPalette.primary,
      'colorPalette.secondary': selectedPalette.secondary,
      'colorPalette.accent': selectedPalette.accent,
      'colorPalette.neutral': selectedPalette.neutral,
      'colorPalette.paletteName': selectedPalette.name,
      'colorPalette.isCustom': false,
      'colorPalette.createdAt': new Date()
    },
    { new: true }
  );
};

// Índices para mejorar el rendimiento
businessSchema.index({ ownerId: 1 });
businessSchema.index({ databaseName: 1 });
businessSchema.index({ status: 1 });
businessSchema.index({ 'profileImage.uploadedAt': -1 });
businessSchema.index({ 'colorPalette.paletteName': 1 });
businessSchema.index({ 'colorPalette.isCustom': 1 });

export default mongoose.model<IBusiness>('Business', businessSchema);
