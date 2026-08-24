import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { SubscriptionPlan } from './subscription-plan.schema';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

@Schema({
  collection: 'payment_transactions',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      ret.planId = ret.planId?.toString?.() ?? ret.planId;
      delete ret.__v;
      return ret;
    },
  },
})
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: SubscriptionPlan.name, required: true })
  planId: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, uppercase: true, index: true })
  transactionId: string;

  @Prop({ trim: true, default: null, index: true })
  providerTransactionId?: string | null;

  @Prop({
    required: true,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.BKASH,
    index: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({ type: Number, required: true, min: 0 })
  amountBdt: number;

  @Prop({ type: String, required: true, default: 'BDT', uppercase: true })
  currency: string;

  @Prop({
    required: true,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  @Prop({ trim: true, default: null })
  gatewayPaymentUrl?: string | null;

  @Prop({ trim: true, default: null })
  gatewayReference?: string | null;

  @Prop({ trim: true, default: null })
  senderNumber?: string | null;

  @Prop({ trim: true, uppercase: true, default: null })
  manualTrxId?: string | null;

  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @Prop({ type: Date, default: null })
  verifiedAt?: Date | null;

  @Prop({ trim: true, default: null })
  verifiedBy?: string | null;

  @Prop({ trim: true, default: null })
  verificationNote?: string | null;

  @Prop({ trim: true, default: null })
  failureCode?: string | null;

  @Prop({ trim: true, default: null })
  failureMessage?: string | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);
PaymentTransactionSchema.index({ userId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ userId: 1, status: 1 });
PaymentTransactionSchema.index({ status: 1, paymentMethod: 1 });
PaymentTransactionSchema.index(
  { paymentMethod: 1, manualTrxId: 1 },
  { unique: true, sparse: true },
);
