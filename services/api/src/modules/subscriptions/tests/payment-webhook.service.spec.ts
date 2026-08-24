import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaymentWebhookService } from '../payment-webhook.service';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';
import { PaymentWebhookEventRepository } from '../repositories/payment-webhook-event.repository';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { SubscriptionActivationService } from '../services/subscription-activation.service';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

describe('PaymentWebhookService', () => {
  let service: PaymentWebhookService;
  let webhookEventRepository: jest.Mocked<PaymentWebhookEventRepository>;
  let transactionRepository: jest.Mocked<PaymentTransactionRepository>;
  let activationService: jest.Mocked<SubscriptionActivationService>;

  const mockProvider = {
    providerName: PaymentMethod.BKASH,
    initiatePayment: jest.fn(),
    verifyPayment: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentWebhookService,
        {
          provide: PaymentProviderRegistry,
          useValue: {
            getProvider: jest.fn().mockReturnValue(mockProvider),
          },
        },
        {
          provide: PaymentWebhookEventRepository,
          useValue: {
            findByProviderAndEventId: jest.fn(),
            recordEvent: jest.fn(),
            markProcessed: jest.fn(),
            markFailed: jest.fn(),
          },
        },
        {
          provide: PaymentTransactionRepository,
          useValue: {
            findByTransactionId: jest.fn(),
            updateVerification: jest.fn(),
          },
        },
        {
          provide: SubscriptionActivationService,
          useValue: {
            activateFromPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PaymentWebhookService);
    webhookEventRepository = module.get(PaymentWebhookEventRepository);
    transactionRepository = module.get(PaymentTransactionRepository);
    activationService = module.get(SubscriptionActivationService);
  });

  it('should reject webhook with UnauthorizedException when signature is invalid', async () => {
    mockProvider.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      service.handleWebhook(PaymentMethod.BKASH, { 'x-signature': 'invalid' }, { eventId: 'EV_1' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return duplicate status without re-activating when webhook event was already processed (Idempotency)', async () => {
    mockProvider.verifyWebhookSignature.mockReturnValue(true);
    webhookEventRepository.findByProviderAndEventId.mockResolvedValue({
      status: 'processed',
    } as any);

    const result = await service.handleWebhook(
      PaymentMethod.BKASH,
      { 'x-signature': 'valid' },
      { eventId: 'EV_ALREADY_DONE' },
    );

    expect(result.status).toBe('duplicate');
    expect(activationService.activateFromPayment).not.toHaveBeenCalled();
  });

  it('should verify payment and activate subscription on valid webhook delivery', async () => {
    mockProvider.verifyWebhookSignature.mockReturnValue(true);
    webhookEventRepository.findByProviderAndEventId.mockResolvedValue(null);
    webhookEventRepository.recordEvent.mockResolvedValue({
      _id: new Types.ObjectId(),
    } as any);

    transactionRepository.findByTransactionId.mockResolvedValue({
      transactionId: 'TXN_SHK_BK_123',
      amountBdt: 199,
      status: PaymentStatus.PENDING,
    } as any);

    mockProvider.verifyPayment.mockResolvedValue({
      isSuccess: true,
      providerTransactionId: 'BK_TRX_999',
    });

    const result = await service.handleWebhook(
      PaymentMethod.BKASH,
      { 'x-signature': 'valid' },
      {
        eventId: 'EV_100',
        transactionId: 'TXN_SHK_BK_123',
        amount: 199,
      },
    );

    expect(result.status).toBe('success');
    expect(activationService.activateFromPayment).toHaveBeenCalledWith(
      'TXN_SHK_BK_123',
      'webhook:bkash',
      'BK_TRX_999',
      expect.any(String),
    );
  });
});
