import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SubscriptionTier } from '../enums/subscription-tier.enum';
import { BillingCycle } from '../enums/billing-cycle.enum';

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;

@Schema({
  collection: 'subscription_plans',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class SubscriptionPlan {
  @Prop({ required: true, unique: true, trim: true, uppercase: true, index: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  nameBn: string;

  @Prop({
    required: true,
    enum: Object.values(SubscriptionTier),
    default: SubscriptionTier.BASIC,
    index: true,
  })
  tier: SubscriptionTier;

  @Prop({
    required: true,
    enum: Object.values(BillingCycle),
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Prop({ type: Number, required: true, min: 0 })
  priceBdt: number;

  @Prop({ type: Number, required: true, min: 1, default: 30 })
  durationDays: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  featuresBn: string[];

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
SubscriptionPlanSchema.index({ tier: 1, isPublished: 1 });
SubscriptionPlanSchema.index({ priceBdt: 1 });
