import mongoose, { Document, Schema } from 'mongoose';
import { CategoryStatus } from '../types/index.js';

export interface IBusinessCategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: CategoryStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): Record<string, unknown>;
}

const businessCategorySchema = new Schema<IBusinessCategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      trim: true,
      default: 'Layers',
    },
    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

businessCategorySchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    icon: this.icon,
    status: this.status,
    displayOrder: this.displayOrder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const BusinessCategory = mongoose.model<IBusinessCategoryDocument>(
  'BusinessCategory',
  businessCategorySchema
);
