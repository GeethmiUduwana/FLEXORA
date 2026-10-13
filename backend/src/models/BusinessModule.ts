import mongoose, { Document, Schema, Types } from 'mongoose';
import { ModuleStatus } from '../types/index.js';

export interface IBusinessModuleDocument extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  moduleCategoryId: Types.ObjectId;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  status: ModuleStatus;
  dependencies: Types.ObjectId[];
  recommendedBusinessTypes: Types.ObjectId[];
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): Record<string, unknown>;
}

const businessModuleSchema = new Schema<IBusinessModuleDocument>(
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
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      default: 'Package',
    },
    moduleCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ModuleCategory',
      required: true,
      index: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(ModuleStatus),
      default: ModuleStatus.ACTIVE,
      index: true,
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'BusinessModule',
      },
    ],
    recommendedBusinessTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'BusinessType',
      },
    ],
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

businessModuleSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    icon: this.icon,
    moduleCategoryId: this.moduleCategoryId?._id
      ? this.moduleCategoryId._id.toString()
      : this.moduleCategoryId?.toString(),
    moduleCategory: this.moduleCategoryId?.name
      ? (typeof this.moduleCategoryId.toSafeJSON === 'function'
          ? this.moduleCategoryId.toSafeJSON()
          : this.moduleCategoryId)
      : undefined,
    monthlyPrice: this.monthlyPrice,
    yearlyPrice: this.yearlyPrice,
    currency: this.currency,
    status: this.status,
    dependencies: (this.dependencies || []).map((dep: any) =>
      dep?._id ? dep._id.toString() : dep?.toString()
    ),
    dependencyModules: (this.dependencies || [])
      .filter((dep: any) => dep && dep._id && dep.name)
      .map((dep: any) =>
        typeof dep.toSafeJSON === 'function' ? dep.toSafeJSON() : dep
      ),
    recommendedBusinessTypes: (this.recommendedBusinessTypes || []).map((bt: any) =>
      bt?._id ? bt._id.toString() : bt?.toString()
    ),
    recommendedTypes: (this.recommendedBusinessTypes || [])
      .filter((bt: any) => bt && bt._id && bt.name)
      .map((bt: any) =>
        typeof bt.toSafeJSON === 'function' ? bt.toSafeJSON() : bt
      ),
    displayOrder: this.displayOrder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const BusinessModule = mongoose.model<IBusinessModuleDocument>(
  'BusinessModule',
  businessModuleSchema
);
