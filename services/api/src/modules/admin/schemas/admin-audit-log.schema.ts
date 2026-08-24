import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminAuditLogDocument = HydratedDocument<AdminAuditLog>;

@Schema({
  collection: 'admin_audit_logs',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class AdminAuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorUserId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  action: string;

  @Prop({ required: true, trim: true, index: true })
  resourceType: string;

  @Prop({ required: true, trim: true, index: true })
  resourceId: string;

  @Prop({ type: Object, default: null })
  before?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  after?: Record<string, any> | null;

  @Prop({ trim: true, default: null })
  reason?: string | null;

  @Prop({ trim: true, default: null })
  ipAddress?: string | null;

  @Prop({ trim: true, default: null })
  userAgent?: string | null;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);
AdminAuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
