import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole, MembershipStatus } from '../types/index.js';

export interface IBusinessMembershipDocument extends Document {
  user: Types.ObjectId;
  tenantId: string;
  role: UserRole;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const businessMembershipSchema = new Schema<IBusinessMembershipDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique membership per user and tenant
businessMembershipSchema.index({ user: 1, tenantId: 1 }, { unique: true });

export const BusinessMembership = mongoose.model<IBusinessMembershipDocument>(
  'BusinessMembership',
  businessMembershipSchema
);
