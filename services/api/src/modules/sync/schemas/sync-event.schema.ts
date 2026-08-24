import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { SyncOperationType } from '../enums/sync-operation-type.enum';
import { SyncEventStatus } from '../enums/sync-event-status.enum';

export type SyncEventDocument = HydratedDocument<SyncEvent>;

@Schema({
  collection: 'sync_events',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class SyncEvent {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  operationId: string;

  @Prop({ required: true, enum: Object.values(SyncOperationType), index: true })
  operationType: SyncOperationType;

  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ required: false, trim: true, default: null })
  entityId?: string | null;

  @Prop({ type: Object, default: null })
  payload?: Record<string, any> | null;

  @Prop({ required: true, enum: Object.values(SyncEventStatus), default: SyncEventStatus.PENDING })
  status: SyncEventStatus;

  @Prop({ type: Date, default: null })
  startedAt?: Date | null;

  @Prop({ type: Object, default: null })
  result?: Record<string, any> | null;

  @Prop({ trim: true, default: null })
  errorCode?: string | null;

  @Prop({ trim: true, default: null })
  errorMessage?: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  retryCount: number;

  @Prop({ type: Date, default: null })
  lastAttemptAt?: Date | null;

  @Prop({ type: Date, default: null })
  appliedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SyncEventSchema = SchemaFactory.createForClass(SyncEvent);
SyncEventSchema.index({ userId: 1, operationId: 1 }, { unique: true });
