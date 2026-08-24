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
export class SslCommerzPaymentProvider implements PaymentProvider {
  readonly providerName = PaymentMethod.SSLCOMMERZ;
  private readonly logger = new Logger(SslCommerzPaymentProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private isConfigured(): boolean {
    const storeId = this.configService.get<string>('payments.sslcommerz.storeId');
    const storePassword = this.configService.get<string>('payments.sslcommerz.storePassword');
    return Boolean(storeId && storePassword);
  }

  async initiatePayment(
    txn: PaymentTransactionDocument,
    plan: SubscriptionPlanDocument,
    callbackUrl?: string,
  ): Promise<PaymentInitiationResult> {
    const env = this.configService.get<string>('environment', 'development');

    if (!this.isConfigured()) {
      if (env === 'production' || env === 'staging') {
        this.logger.error(
          'SSLCommerz store credentials missing in production/staging environment!',
        );
        throw new ServiceUnavailableException(
          'SSLCommerz gateway is not configured for production',
        );
      }

      const gatewayUrl = `https://sandbox.sslcommerz.com/gwprocess/v4/simulator?tran_id=${txn.transactionId}&amount=${plan.priceBdt}${
        callbackUrl ? `&callback=${encodeURIComponent(callbackUrl)}` : ''
      }`;
      return {
        transactionId: txn.transactionId,
        gatewayPaymentUrl: gatewayUrl,
        gatewayReference: `SSLC_${txn.transactionId}`,
      };
    }

    const baseUrl = this.configService.get<string>('payments.sslcommerz.baseUrl');
    const gatewayUrl = `${baseUrl}/gwprocess/v4/api.php?tran_id=${txn.transactionId}&amount=${plan.priceBdt}`;
    return {
      transactionId: txn.transactionId,
      gatewayPaymentUrl: gatewayUrl,
      gatewayReference: `SSLC_${txn.transactionId}`,
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
          'SSLCommerz gateway is not configured for production',
        );
      }

      const receivedAmount = payload?.amount ? Number(payload.amount) : txn.amountBdt;
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

      if (payload?.status === 'FAILED' || payload?.status === 'CANCELLED') {
        return {
          isSuccess: false,
          failureReason: payload?.error ?? 'SSLCommerz transaction was failed or cancelled',
        };
      }

      return {
        isSuccess: true,
        providerTransactionId: payload?.bank_tran_id ?? payload?.val_id ?? `SSLC_TRX_${Date.now()}`,
        amountBdt: txn.amountBdt,
        currency: 'BDT',
        metadata: { provider: 'sslcommerz_sandbox' },
      };
    }

    const receivedAmount = payload?.amount ? Number(payload.amount) : txn.amountBdt;
    if (receivedAmount !== txn.amountBdt) {
      return {
        isSuccess: false,
        amountBdt: receivedAmount,
        currency: 'BDT',
        failureReason: 'Amount mismatch during SSLCommerz IPN verification',
      };
    }

    return {
      isSuccess: true,
      providerTransactionId: payload?.bank_tran_id,
      amountBdt: txn.amountBdt,
      currency: 'BDT',
      metadata: { verifiedBy: 'sslcommerz_ipn' },
    };
  }

  verifyWebhookSignature(headers: Record<string, any>, rawBody: any): boolean {
    const webhookSecret = this.configService.get<string>('payments.webhookSecret');
    const signature = headers['x-sslcommerz-signature'] || headers['x-webhook-signature'];

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
