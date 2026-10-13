import mongoose, { Document, Schema, Types } from 'mongoose';
import { BusinessStatus } from '../types/index.js';

export interface IBusinessDocument extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  businessTypeId?: Types.ObjectId | null;
  customBusinessType?: string | null;
  description: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  logo?: string | null;
  employeeCount: number;
  customerCount: number;
  mainServices: string[];
  productsSold: string[];
  onlineBookingRequired: boolean;
  onlinePaymentsRequired: boolean;
  status: BusinessStatus;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): Record<string, unknown>;
}

const businessSchema = new Schema<IBusinessDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessCategory',
      required: true,
      index: true,
    },
    businessTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessType',
      default: null,
      index: true,
    },
    customBusinessType: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    logo: {
      type: String,
      trim: true,
      default: null,
    },
    employeeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    customerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    mainServices: {
      type: [String],
      default: [],
    },
    productsSold: {
      type: [String],
      default: [],
    },
    onlineBookingRequired: {
      type: Boolean,
      default: false,
    },
    onlinePaymentsRequired: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(BusinessStatus),
      default: BusinessStatus.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

businessSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    ownerId: this.ownerId.toString(),
    categoryId: this.categoryId ? this.categoryId._id ? this.categoryId._id.toString() : this.categoryId.toString() : null,
    category: this.populated('categoryId') ? (this.categoryId as any).toSafeJSON ? (this.categoryId as any).toSafeJSON() : this.categoryId : undefined,
    businessTypeId: this.businessTypeId ? this.businessTypeId._id ? this.businessTypeId._id.toString() : this.businessTypeId.toString() : null,
    businessType: this.populated('businessTypeId') ? (this.businessTypeId as any).toSafeJSON ? (this.businessTypeId as any).toSafeJSON() : this.businessTypeId : undefined,
    customBusinessType: this.customBusinessType,
    description: this.description,
    email: this.email,
    phone: this.phone,
    address: this.address,
    website: this.website,
    logo: this.logo,
    employeeCount: this.employeeCount,
    customerCount: this.customerCount,
    mainServices: this.mainServices,
    productsSold: this.productsSold,
    onlineBookingRequired: this.onlineBookingRequired,
    onlinePaymentsRequired: this.onlinePaymentsRequired,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Business = mongoose.model<IBusinessDocument>('Business', businessSchema);
