import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefreshSessionDocument = HydratedDocument<RefreshSession>;

@Schema({
  collection: 'refresh_sessions',
  timestamps: true,
})
export class RefreshSession {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ type: String, required: false })
  deviceId?: string;

  @Prop({ type: String, required: false })
  deviceName?: string;

  @Prop({
    required: true,
    // TTL index: MongoDB automatically deletes documents when expiresAt is reached
    index: { expires: 0 },
  })
  expiresAt: Date;

  @Prop({ type: Date, required: false, default: null })
  revokedAt: Date | null;

  // Populated by timestamps: true
  createdAt: Date;
  updatedAt: Date;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);
