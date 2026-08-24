import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentTransactionDocument } from '../schemas/payment-transaction.schema';
import { SubscriptionPlanDocument } from '../schemas/subscription-plan.schema';

export interface PaymentInitiationResult {
  transactionId: string;
  gatewayPaymentUrl: string;
  gatewayReference?: string;
}

export interface PaymentVerificationResult {
  isSuccess: boolean;
  providerTransactionId?: string;
  amountBdt?: number;
  currency?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  readonly providerName: PaymentMethod;

  initiatePayment(
    txn: PaymentTransactionDocument,
    plan: SubscriptionPlanDocument,
    callbackUrl?: string,
  ): Promise<PaymentInitiationResult>;

  verifyPayment(
    txn: PaymentTransactionDocument,
    payload?: Record<string, any>,
  ): Promise<PaymentVerificationResult>;

  verifyWebhookSignature(headers: Record<string, any>, rawBody: any): Promise<boolean> | boolean;
}
