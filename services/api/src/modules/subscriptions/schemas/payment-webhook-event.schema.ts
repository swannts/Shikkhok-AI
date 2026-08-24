import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PaymentMethod } from '../enums/payment-method.enum';

export type PaymentWebhookEventDocument = HydratedDocument<PaymentWebhookEvent>;

@Schema({
  collection: 'payment_webhook_events',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class PaymentWebhookEvent {
  @Prop({
    required: true,
    enum: Object.values(PaymentMethod),
    index: true,
  })
  provider: PaymentMethod;

  @Prop({ required: true, trim: true })
  eventId: string;

  @Prop({ trim: true, default: null, index: true })
  transactionId?: string | null;

  @Prop({ required: true, trim: true })
  payloadHash: string;

  @Prop({
    required: true,
    enum: ['received', 'processed', 'failed', 'duplicate'],
    default: 'received',
  })
  status: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  receivedAt: Date;

  @Prop({ type: Date, default: null })
  processedAt?: Date | null;

  @Prop({ trim: true, default: null })
  error?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const PaymentWebhookEventSchema = SchemaFactory.createForClass(PaymentWebhookEvent);
PaymentWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
