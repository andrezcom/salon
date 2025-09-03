import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  databaseName: string;
  status: 'active' | 'inactive' | 'suspended';
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

// Índices para mejorar el rendimiento
businessSchema.index({ ownerId: 1 });
businessSchema.index({ databaseName: 1 });
businessSchema.index({ status: 1 });

export default mongoose.model<IBusiness>('Business', businessSchema);
