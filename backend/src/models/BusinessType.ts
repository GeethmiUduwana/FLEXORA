import mongoose, { Document, Schema, Types } from 'mongoose';
import { CategoryStatus } from '../types/index.js';

export interface IBusinessTypeDocument extends Document {
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  description?: string;
  status: CategoryStatus;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): Record<string, unknown>;
}

const businessTypeSchema = new Schema<IBusinessTypeDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessCategory',
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

businessTypeSchema.index({ categoryId: 1, slug: 1 }, { unique: true });

businessTypeSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    categoryId: this.categoryId.toString(),
    description: this.description,
    status: this.status,
    isCustom: this.isCustom,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const BusinessType = mongoose.model<IBusinessTypeDocument>(
  'BusinessType',
  businessTypeSchema
);
