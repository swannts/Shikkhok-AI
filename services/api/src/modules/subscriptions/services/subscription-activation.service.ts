import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from '../repositories/student-subscription.repository';
import { PaymentStateMachineService } from './payment-state-machine.service';
import { PaymentStatus } from '../enums/payment-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { StudentSubscriptionDocument } from '../schemas/student-subscription.schema';
import { PaymentTransactionDocument } from '../schemas/payment-transaction.schema';

export interface ActivationResult {
  isAlreadyActive: boolean;
  subscription: StudentSubscriptionDocument;
  transaction: PaymentTransactionDocument;
}

@Injectable()
export class SubscriptionActivationService {
  private readonly logger = new Logger(SubscriptionActivationService.name);

  constructor(
    private readonly transactionRepository: PaymentTransactionRepository,
    private readonly planRepository: SubscriptionPlanRepository,
    private readonly subscriptionRepository: StudentSubscriptionRepository,
    private readonly stateMachine: PaymentStateMachineService,
  ) {}

  async activateFromPayment(
    transactionId: string,
    verifiedBy: string,
    providerTransactionId?: string,
    verificationNote?: string,
  ): Promise<ActivationResult> {
    const txn = await this.transactionRepository.findByTransactionId(transactionId);
    if (!txn) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    // Idempotency check: if transaction is already completed, return existing subscription
    if (txn.status === PaymentStatus.COMPLETED) {
      const activeSub = await this.subscriptionRepository.findActiveByUserId(txn.userId.toString());
      if (activeSub && activeSub.paymentTransactionId === transactionId) {
        this.logger.log(
          `Idempotent activation hit: Transaction ${transactionId} already activated subscription ${activeSub._id}`,
        );
        return {
          isAlreadyActive: true,
          subscription: activeSub,
          transaction: txn,
        };
      }
    }

    // Validate state transition to COMPLETED
    this.stateMachine.validateTransition(txn.status, PaymentStatus.COMPLETED, transactionId);

    const plan = await this.planRepository.findById(txn.planId.toString());
    if (!plan) {
      throw new NotFoundException(`Subscription plan for transaction ${transactionId} not found`);
    }

    // Update transaction to COMPLETED with audit verification trail
    const updatedTxn = await this.transactionRepository.updateVerification(
      transactionId,
      PaymentStatus.COMPLETED,
      verifiedBy,
      verificationNote,
    );

    if (!updatedTxn) {
      throw new BadRequestException(`Failed to update transaction ${transactionId} to COMPLETED`);
    }

    if (providerTransactionId) {
      updatedTxn.providerTransactionId = providerTransactionId;
      await updatedTxn.save();
    }

    // Deactivate previous active subscriptions for user
    await this.subscriptionRepository.deactivatePreviousSubscriptions(txn.userId.toString());

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await this.subscriptionRepository.activateSubscription({
      userId: txn.userId,
      planId: plan._id,
      tier: plan.tier,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      paymentTransactionId: transactionId,
      autoRenew: false,
    });

    this.logger.log(
      `Subscription activated successfully: User ${txn.userId}, Plan ${plan.code}, Tier ${plan.tier}, Valid until ${endDate.toISOString()}, VerifiedBy ${verifiedBy}`,
    );

    return {
      isAlreadyActive: false,
      subscription,
      transaction: updatedTxn,
    };
  }

  async rejectPayment(
    transactionId: string,
    verifiedBy: string,
    rejectionReason: string,
  ): Promise<PaymentTransactionDocument> {
    const txn = await this.transactionRepository.findByTransactionId(transactionId);
    if (!txn) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    this.stateMachine.validateTransition(txn.status, PaymentStatus.FAILED, transactionId);

    const updatedTxn = await this.transactionRepository.updateVerification(
      transactionId,
      PaymentStatus.FAILED,
      verifiedBy,
      rejectionReason,
      'MANUAL_REJECTION',
      rejectionReason,
    );

    if (!updatedTxn) {
      throw new BadRequestException(`Failed to reject transaction ${transactionId}`);
    }

    this.logger.warn(
      `Transaction ${transactionId} rejected by ${verifiedBy}. Reason: ${rejectionReason}`,
    );
    return updatedTxn;
  }
}
