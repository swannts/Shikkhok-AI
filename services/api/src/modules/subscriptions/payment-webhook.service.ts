import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaymentWebhookEventRepository } from './repositories/payment-webhook-event.repository';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository';
import { SubscriptionActivationService } from './services/subscription-activation.service';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly webhookEventRepository: PaymentWebhookEventRepository,
    private readonly transactionRepository: PaymentTransactionRepository,
    private readonly activationService: SubscriptionActivationService,
  ) {}

  async handleWebhook(
    providerMethod: PaymentMethod,
    headers: Record<string, any>,
    payload: Record<string, any>,
  ): Promise<{ status: string; message: string }> {
    const provider = this.providerRegistry.getProvider(providerMethod);

    // 1. Cryptographic signature and secret verification
    const isValidSignature = await provider.verifyWebhookSignature(headers, payload);
    if (!isValidSignature) {
      this.logger.warn(
        `Security alert: Unauthorized webhook signature rejected for provider ${providerMethod}`,
      );
      throw new UnauthorizedException(`Invalid or missing webhook signature for ${providerMethod}`);
    }

    // 2. Extract Event ID & Transaction ID
    const eventId =
      payload.eventId ||
      payload.event_id ||
      payload.trxID ||
      payload.paymentID ||
      payload.paymentRefId ||
      payload.val_id ||
      payload.bank_tran_id ||
      payload.transactionId ||
      payload.tran_id;

    if (!eventId) {
      throw new BadRequestException('Webhook payload missing event or transaction identifier');
    }

    const transactionId =
      payload.transactionId ||
      payload.tran_id ||
      payload.merchantInvoiceNumber ||
      payload.order_id ||
      payload.additionalData?.transactionId;

    // 3. Idempotency Check
    const existingEvent = await this.webhookEventRepository.findByProviderAndEventId(
      providerMethod,
      eventId.toString(),
    );

    if (existingEvent && existingEvent.status === 'processed') {
      this.logger.log(
        `Idempotent webhook duplicate skipped: Provider ${providerMethod}, EventId ${eventId}`,
      );
      return { status: 'duplicate', message: 'Webhook event already processed' };
    }

    // 4. Record event
    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    const recordedEvent = await this.webhookEventRepository.recordEvent({
      provider: providerMethod,
      eventId: eventId.toString(),
      transactionId: transactionId ? transactionId.toString() : null,
      payloadHash,
      status: 'received',
      receivedAt: new Date(),
    });

    if (!transactionId) {
      await this.webhookEventRepository.markFailed(
        recordedEvent._id.toString(),
        'Missing transactionId in payload',
      );
      throw new BadRequestException('Webhook payload missing target transactionId');
    }

    // 5. Look up transaction
    const txn = await this.transactionRepository.findByTransactionId(transactionId);
    if (!txn) {
      await this.webhookEventRepository.markFailed(
        recordedEvent._id.toString(),
        `Transaction ${transactionId} not found`,
      );
      throw new NotFoundException(`Payment transaction ${transactionId} not found`);
    }

    // 6. Verify with provider
    const verification = await provider.verifyPayment(txn, payload);
    if (!verification.isSuccess) {
      this.logger.warn(
        `Payment verification failed for transaction ${transactionId}: ${verification.failureReason}`,
      );
      await this.transactionRepository.updateVerification(
        transactionId,
        txn.status,
        `webhook:${providerMethod}`,
        verification.failureReason,
        'VERIFICATION_FAILED',
        verification.failureReason,
      );
      await this.webhookEventRepository.markFailed(
        recordedEvent._id.toString(),
        verification.failureReason ?? 'Verification failed',
      );
      return {
        status: 'failed',
        message: verification.failureReason ?? 'Payment verification failed',
      };
    }

    // 7. Activate subscription idempotently
    await this.activationService.activateFromPayment(
      transactionId,
      `webhook:${providerMethod}`,
      verification.providerTransactionId,
      'Verified via provider webhook callback',
    );

    await this.webhookEventRepository.markProcessed(recordedEvent._id.toString());
    return {
      status: 'success',
      message: 'Payment successfully verified and subscription activated',
    };
  }
}
