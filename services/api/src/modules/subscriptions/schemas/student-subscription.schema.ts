import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { SubscriptionPlan } from './subscription-plan.schema';
import { SubscriptionTier } from '../enums/subscription-tier.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export type StudentSubscriptionDocument = HydratedDocument<StudentSubscription>;

@Schema({
  collection: 'student_subscriptions',
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
export class StudentSubscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: SubscriptionPlan.name, required: true })
  planId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(SubscriptionTier),
    default: SubscriptionTier.FREE,
    index: true,
  })
  tier: SubscriptionTier;

  @Prop({
    required: true,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.ACTIVE,
    index: true,
  })
  status: SubscriptionStatus;

  @Prop({ type: Date, required: true, default: () => new Date() })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ trim: true, default: null })
  paymentTransactionId?: string | null;

  @Prop({ type: Boolean, default: false })
  autoRenew: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const StudentSubscriptionSchema = SchemaFactory.createForClass(StudentSubscription);
StudentSubscriptionSchema.index({ userId: 1, status: 1 });
StudentSubscriptionSchema.index({ userId: 1, endDate: -1 });
