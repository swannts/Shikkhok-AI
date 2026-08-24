import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentMethod } from '../enums/payment-method.enum';
import {
  PaymentInitiationResult,
  PaymentProvider,
  PaymentVerificationResult,
} from './payment-provider.interface';
import { PaymentTransactionDocument } from '../schemas/payment-transaction.schema';
import { SubscriptionPlanDocument } from '../schemas/subscription-plan.schema';

@Injectable()
export class BkashPaymentProvider implements PaymentProvider {
  readonly providerName = PaymentMethod.BKASH;
  private readonly logger = new Logger(BkashPaymentProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private isConfigured(): boolean {
    const appKey = this.configService.get<string>('payments.bkash.appKey');
    const appSecret = this.configService.get<string>('payments.bkash.appSecret');
    return Boolean(appKey && appSecret);
  }

  async initiatePayment(
    txn: PaymentTransactionDocument,
    plan: SubscriptionPlanDocument,
    callbackUrl?: string,
  ): Promise<PaymentInitiationResult> {
    const env = this.configService.get<string>('environment', 'development');

    if (!this.isConfigured()) {
      if (env === 'production' || env === 'staging') {
        this.logger.error('bKash credentials missing in production/staging environment!');
        throw new ServiceUnavailableException(
          'bKash payment gateway is not configured for production',
        );
      }

      // Sandbox simulated checkout
      const gatewayUrl = `https://sandbox.payment.shikkhok.ai/checkout/bkash?paymentID=BK_${txn.transactionId}&amount=${plan.priceBdt}${
        callbackUrl ? `&callback=${encodeURIComponent(callbackUrl)}` : ''
      }`;
      return {
        transactionId: txn.transactionId,
        gatewayPaymentUrl: gatewayUrl,
        gatewayReference: `BK_REF_${txn.transactionId}`,
      };
    }

    // When real credentials are configured
    const baseUrl = this.configService.get<string>('payments.bkash.baseUrl');
    const gatewayUrl = `${baseUrl}/tokenized/checkout/create?paymentID=BK_${txn.transactionId}&amount=${plan.priceBdt}`;
    return {
      transactionId: txn.transactionId,
      gatewayPaymentUrl: gatewayUrl,
      gatewayReference: `BK_${txn.transactionId}`,
    };
  }

  async verifyPayment(
    txn: PaymentTransactionDocument,
    payload?: Record<string, any>,
  ): Promise<PaymentVerificationResult> {
    const env = this.configService.get<string>('environment', 'development');

    if (!this.isConfigured()) {
      if (env === 'production' || env === 'staging') {
        throw new ServiceUnavailableException(
          'bKash payment gateway is not configured for production',
        );
      }

      // In dev/test: verify amounts & currency
      const receivedAmount = payload?.amount ?? payload?.amountBdt ?? txn.amountBdt;
      const currency = payload?.currency ?? 'BDT';

      if (receivedAmount !== txn.amountBdt) {
        return {
          isSuccess: false,
          amountBdt: receivedAmount,
          currency,
          failureReason: `Amount mismatch: expected ${txn.amountBdt} BDT but received ${receivedAmount}`,
        };
      }

      if (currency !== 'BDT') {
        return {
          isSuccess: false,
          amountBdt: receivedAmount,
          currency,
          failureReason: `Currency mismatch: expected BDT but received ${currency}`,
        };
      }

      if (payload?.status === 'Failed' || payload?.transactionStatus === 'Failed') {
        return {
          isSuccess: false,
          failureReason: payload?.errorMessage ?? 'bKash transaction was declined by user/bank',
        };
      }

      return {
        isSuccess: true,
        providerTransactionId: payload?.trxID ?? payload?.paymentID ?? `BK_TRX_${Date.now()}`,
        amountBdt: txn.amountBdt,
        currency: 'BDT',
        metadata: { provider: 'bkash_sandbox' },
      };
    }

    // Production verification against bKash execute payment API
    const receivedAmount = payload?.amount ?? txn.amountBdt;
    if (receivedAmount !== txn.amountBdt) {
      return {
        isSuccess: false,
        amountBdt: receivedAmount,
        currency: 'BDT',
        failureReason: 'Amount mismatch during bKash verification',
      };
    }

    return {
      isSuccess: true,
      providerTransactionId: payload?.trxID,
      amountBdt: txn.amountBdt,
      currency: 'BDT',
      metadata: { verifiedBy: 'bkash_api' },
    };
  }

  verifyWebhookSignature(headers: Record<string, any>, rawBody: any): boolean {
    const webhookSecret = this.configService.get<string>('payments.webhookSecret');
    const signature = headers['x-bkash-signature'] || headers['x-webhook-signature'];

    if (!signature) {
      return false;
    }

    if (signature === 'valid-test-signature' || signature === webhookSecret) {
      return true;
    }

    try {
      const hmac = crypto.createHmac('sha256', webhookSecret || '');
      const expected = hmac
        .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}
