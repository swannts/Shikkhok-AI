import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../enums/payment-method.enum';
import {
  PaymentInitiationResult,
  PaymentProvider,
  PaymentVerificationResult,
} from './payment-provider.interface';
import { PaymentTransactionDocument } from '../schemas/payment-transaction.schema';
import { SubscriptionPlanDocument } from '../schemas/subscription-plan.schema';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly providerName = PaymentMethod.MANUAL;
  private readonly logger = new Logger(MockPaymentProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private assertAllowedEnvironment(): void {
    const env = this.configService.get<string>('environment', 'development');
    if (env === 'production' || env === 'staging') {
      this.logger.error('CRITICAL: MockPaymentProvider invoked in production/staging environment!');
      throw new ServiceUnavailableException(
        'Mock payment provider is disabled in production environments. Real gateway credentials required.',
      );
    }
  }

  async initiatePayment(
    txn: PaymentTransactionDocument,
    plan: SubscriptionPlanDocument,
    callbackUrl?: string,
  ): Promise<PaymentInitiationResult> {
    this.assertAllowedEnvironment();
    const url = `https://sandbox.shikkhok.ai/checkout/mock?txnId=${txn.transactionId}&amount=${plan.priceBdt}${
      callbackUrl ? `&callback=${encodeURIComponent(callbackUrl)}` : ''
    }`;

    return {
      transactionId: txn.transactionId,
      gatewayPaymentUrl: url,
      gatewayReference: `MOCK_REF_${txn.transactionId}`,
    };
  }

  async verifyPayment(
    txn: PaymentTransactionDocument,
    payload?: Record<string, any>,
  ): Promise<PaymentVerificationResult> {
    this.assertAllowedEnvironment();

    // Check if payload specifies failure or mismatch in tests
    if (payload?.simulateFailure) {
      return {
        isSuccess: false,
        failureReason: payload.failureReason ?? 'Simulated payment failure',
      };
    }

    if (payload?.amountBdt && payload.amountBdt !== txn.amountBdt) {
      return {
        isSuccess: false,
        amountBdt: payload.amountBdt,
        currency: 'BDT',
        failureReason: 'Amount mismatch detected during verification',
      };
    }

    if (payload?.currency && payload.currency !== 'BDT') {
      return {
        isSuccess: false,
        amountBdt: txn.amountBdt,
        currency: payload.currency,
        failureReason: 'Currency mismatch detected during verification',
      };
    }

    return {
      isSuccess: true,
      providerTransactionId: `MOCK_TRX_${Date.now()}`,
      amountBdt: txn.amountBdt,
      currency: 'BDT',
      metadata: { verifiedBy: 'mock_provider' },
    };
  }

  verifyWebhookSignature(headers: Record<string, any>, _rawBody: any): boolean {
    this.assertAllowedEnvironment();
    const webhookSecret = this.configService.get<string>('payments.webhookSecret');
    const signature = headers['x-webhook-signature'] || headers['x-signature'];
    if (!signature) {
      return false;
    }
    return signature === webhookSecret || signature === 'valid-test-signature';
  }
}
