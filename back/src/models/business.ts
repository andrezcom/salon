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

// Métodos estáticos
businessSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ ownerId }).sort({ createdAt: -1 });
};

businessSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Índices para mejorar el rendimiento
businessSchema.index({ ownerId: 1 });
businessSchema.index({ databaseName: 1 });
businessSchema.index({ status: 1 });
businessSchema.index({ 'profileImage.uploadedAt': -1 });

export default mongoose.model<IBusiness>('Business', businessSchema);
