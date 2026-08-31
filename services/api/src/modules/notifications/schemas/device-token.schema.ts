import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DeviceTokenDocument = HydratedDocument<DeviceToken>;

export type DevicePlatform = 'android' | 'ios' | 'web';

@Schema({
  collection: 'device_tokens',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class DeviceToken {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  token: string;

  @Prop({ required: true, enum: ['android', 'ios', 'web'], default: 'android' })
  platform: DevicePlatform;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now, index: true })
  lastSeenAt: Date;

  @Prop({ type: String, default: null })
  appVersion?: string | null;

  @Prop({ type: String, default: null })
  deviceModel?: string | null;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);
DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
DeviceTokenSchema.index({ userId: 1, isActive: 1 });
