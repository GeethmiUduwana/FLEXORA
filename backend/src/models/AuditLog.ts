import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLogDocument extends Document {
  adminId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    adminId: this.adminId.toString(),
    action: this.action,
    entityType: this.entityType,
    entityId: this.entityId,
    details: this.details,
    createdAt: this.createdAt,
  };
};

export const AuditLog = mongoose.model<IAuditLogDocument>(
  'AuditLog',
  auditLogSchema
);
