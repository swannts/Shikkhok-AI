import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SyncDeviceCheckpointDocument = HydratedDocument<SyncDeviceCheckpoint>;

@Schema({
  collection: 'sync_device_checkpoints',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class SyncDeviceCheckpoint {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  deviceId: string;

  @Prop({ type: Date, default: null })
  lastSyncedAt?: Date | null;

  @Prop({ trim: true, default: null })
  lastOperationId?: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  lastBatchSize: number;

  @Prop({ trim: true, default: 'applied' })
  lastStatus: string;

  createdAt: Date;
  updatedAt: Date;
}

export const SyncDeviceCheckpointSchema = SchemaFactory.createForClass(SyncDeviceCheckpoint);
SyncDeviceCheckpointSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
