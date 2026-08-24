import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from './repositories/student-subscription.repository';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository';
import { SubscriptionTier } from './enums/subscription-tier.enum';
import { BillingCycle } from './enums/billing-cycle.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ManualPaymentSubmitDto } from './dto/manual-payment-submit.dto';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  constructor(
    private readonly planRepository: SubscriptionPlanRepository,
    private readonly subscriptionRepository: StudentSubscriptionRepository,
    private readonly transactionRepository: PaymentTransactionRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultPlans();
  }

  async listPlans(): Promise<Record<string, any>[]> {
    const plans = await this.planRepository.findPublished();
    return plans.map((p) => p.toJSON());
  }

  async getMySubscription(currentUser: AuthenticatedUser): Promise<Record<string, any>> {
    const activeSub = await this.subscriptionRepository.findActiveByUserId(currentUser.userId);
    if (!activeSub) {
      return {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        planName: 'ফ্রি প্ল্যান',
        daysRemaining: null,
        isPremium: false,
        featuresBn: ['দৈনিক ৫টি এআই টিউটর প্রশ্ন', 'অধ্যায়ভিত্তিক পাঠ্যসূচি', 'মৌলিক অনুশীলন'],
      };
    }

    const plan = await this.planRepository.findById(activeSub.planId.toString());
    const now = new Date();
    const msRemaining = activeSub.endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      tier: activeSub.tier,
      status: activeSub.status,
      planName: plan?.nameBn ?? 'প্রিমিয়াম প্ল্যান',
      startDate: activeSub.startDate,
      endDate: activeSub.endDate,
      daysRemaining,
      isPremium:
        activeSub.tier === SubscriptionTier.PREMIUM ||
        activeSub.tier === SubscriptionTier.SCHOLARSHIP,
      featuresBn: plan?.featuresBn ?? [
        'আনলিমিটেড এআই টিউটর চ্যাট',
        'মডেল টেস্ট ও পূর্ণাঙ্গ ফলাফল',
        'হোমওয়ার্ক এআই মূল্যায়ন',
      ],
    };
  }

  async initiatePayment(
    currentUser: AuthenticatedUser,
    dto: InitiatePaymentDto,
  ): Promise<Record<string, any>> {
    const plan = await this.planRepository.findById(dto.planId);
    if (!plan || !plan.isPublished) {
      throw new NotFoundException('Subscription plan not found');
    }

    const transactionId = `TXN_SHK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const gatewayUrl = `https://payment.shikkhok.ai/checkout/${dto.paymentMethod}?txnId=${transactionId}&amount=${plan.priceBdt}`;

    const transaction = await this.transactionRepository.createTransaction({
      userId: new Types.ObjectId(currentUser.userId),
      planId: plan._id,
      transactionId,
      paymentMethod: dto.paymentMethod,
      amountBdt: plan.priceBdt,
      status: PaymentStatus.PENDING,
      gatewayPaymentUrl: gatewayUrl,
      metadata: {
        callbackUrl: dto.callbackUrl,
        planCode: plan.code,
      },
    });

    return {
      transactionId,
      amountBdt: plan.priceBdt,
      paymentMethod: dto.paymentMethod,
      gatewayPaymentUrl: gatewayUrl,
      transaction: transaction.toJSON(),
    };
  }

  async verifyPayment(
    currentUser: AuthenticatedUser,
    dto: VerifyPaymentDto,
  ): Promise<Record<string, any>> {
    const txn = await this.transactionRepository.findByTransactionId(dto.transactionId);
    if (!txn) {
      throw new NotFoundException('Transaction not found');
    }

    if (txn.status === PaymentStatus.COMPLETED) {
      return {
        message: 'Payment already verified and subscription is active',
        transaction: txn.toJSON(),
      };
    }

    const plan = await this.planRepository.findById(txn.planId.toString());
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Mark transaction as completed
    const completedTxn = await this.transactionRepository.updateStatus(
      dto.transactionId,
      PaymentStatus.COMPLETED,
      new Date(),
    );

    // Deactivate existing subscriptions and activate new
    await this.subscriptionRepository.deactivatePreviousSubscriptions(currentUser.userId);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await this.subscriptionRepository.activateSubscription({
      userId: new Types.ObjectId(currentUser.userId),
      planId: plan._id,
      tier: plan.tier,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      paymentTransactionId: dto.transactionId,
      autoRenew: false,
    });

    return {
      message: 'Subscription successfully activated',
      subscription: subscription.toJSON(),
      transaction: completedTxn?.toJSON(),
    };
  }

  async submitManualPayment(
    currentUser: AuthenticatedUser,
    dto: ManualPaymentSubmitDto,
  ): Promise<Record<string, any>> {
    const plan = await this.planRepository.findById(dto.planId);
    if (!plan || !plan.isPublished) {
      throw new NotFoundException('Subscription plan not found');
    }

    const transactionId = `MANUAL_SHK_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const transaction = await this.transactionRepository.createTransaction({
      userId: new Types.ObjectId(currentUser.userId),
      planId: plan._id,
      transactionId,
      paymentMethod: dto.paymentMethod,
      amountBdt: plan.priceBdt,
      status: PaymentStatus.COMPLETED,
      senderNumber: dto.senderNumber.trim(),
      manualTrxId: dto.manualTrxId.trim().toUpperCase(),
      paidAt: new Date(),
      metadata: { source: 'manual_mfs_submit' },
    });

    await this.subscriptionRepository.deactivatePreviousSubscriptions(currentUser.userId);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await this.subscriptionRepository.activateSubscription({
      userId: new Types.ObjectId(currentUser.userId),
      planId: plan._id,
      tier: plan.tier,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      paymentTransactionId: transactionId,
      autoRenew: false,
    });

    return {
      message: 'Manual MFS payment submitted and subscription activated',
      subscription: subscription.toJSON(),
      transaction: transaction.toJSON(),
    };
  }

  private async seedDefaultPlans(): Promise<void> {
    const defaults = [
      {
        code: 'FREE_TIER',
        name: 'Free Starter Plan',
        nameBn: 'ফ্রি স্টার্টার প্ল্যান',
        tier: SubscriptionTier.FREE,
        billingCycle: BillingCycle.LIFETIME,
        priceBdt: 0,
        durationDays: 3650,
        features: ['5 AI tutor queries daily', 'NCTB curriculum lessons', 'Basic practice'],
        featuresBn: [
          'দৈনিক ৫টি এআই টিউটর প্রশ্ন',
          'এনসিটিবি পাঠ্যবই ও অধ্যায়',
          'মৌলিক অনুশীলন কুইজ',
        ],
        isPublished: true,
      },
      {
        code: 'PREMIUM_MONTHLY',
        name: 'Premium Monthly',
        nameBn: 'প্রিমিয়াম মাসিক প্ল্যান',
        tier: SubscriptionTier.PREMIUM,
        billingCycle: BillingCycle.MONTHLY,
        priceBdt: 199,
        durationDays: 30,
        features: [
          'Unlimited AI tutor streaming',
          'Model tests & timed exams',
          'Homework AI feedback & OCR',
          'Offline downloads',
        ],
        featuresBn: [
          'আনলিমিটেড এআই টিউটর চ্যাট',
          'পূর্ণাঙ্গ মডেল টেস্ট ও লাইভ রেজাল্ট',
          'হোমওয়ার্ক খাতা মূল্যায়ন ও ফিডব্যাক',
          'অফলাইন ডাউনলোড সুবিধা',
        ],
        isPublished: true,
      },
      {
        code: 'PREMIUM_YEARLY',
        name: 'Premium Yearly (Save 40%)',
        nameBn: 'প্রিমিয়াম বার্ষিক প্ল্যান (৪০% ছাড়)',
        tier: SubscriptionTier.PREMIUM,
        billingCycle: BillingCycle.YEARLY,
        priceBdt: 1499,
        durationDays: 365,
        features: [
          'All Premium features for 1 full year',
          'Priority AI generation',
          'Parent analytics reports',
          'Board exam question bank',
        ],
        featuresBn: [
          'সম্পূর্ণ ১ বছর সব প্রিমিয়াম সুবিধা',
          'অগ্রাধিকারভিত্তিক দ্রুত এআই রেসপন্স',
          'অভিভাবক সাপ্তাহিক রিপোর্ট ও এনালাইটিক্স',
          'বোর্ড পরীক্ষার প্রশ্নব্যাংক সমাধান',
        ],
        isPublished: true,
      },
    ];

    for (const p of defaults) {
      const exists = await this.planRepository.findByCode(p.code);
      if (!exists) {
        await this.planRepository.createPlan(p);
      }
    }
  }
}
