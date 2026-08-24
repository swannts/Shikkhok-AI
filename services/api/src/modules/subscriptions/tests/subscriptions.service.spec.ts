import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from '../repositories/student-subscription.repository';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';
import { SubscriptionActivationService } from '../services/subscription-activation.service';
import { PaymentStateMachineService } from '../services/payment-state-machine.service';
import { SubscriptionTier } from '../enums/subscription-tier.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { UserRole } from '../../users/enums/user-role.enum';

describe('SubscriptionsService Hardening', () => {
  let service: SubscriptionsService;
  let planRepository: jest.Mocked<SubscriptionPlanRepository>;
  let subscriptionRepository: jest.Mocked<StudentSubscriptionRepository>;
  let transactionRepository: jest.Mocked<PaymentTransactionRepository>;
  let activationService: jest.Mocked<SubscriptionActivationService>;

  const studentUserId = new Types.ObjectId().toString();
  const studentUser = { userId: studentUserId, role: UserRole.STUDENT };
  const attackerUser = { userId: new Types.ObjectId().toString(), role: UserRole.STUDENT };

  const mockPlan = {
    _id: new Types.ObjectId(),
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    nameBn: 'প্রিমিয়াম মাসিক প্ল্যান',
    tier: SubscriptionTier.PREMIUM,
    priceBdt: 199,
    durationDays: 30,
    isPublished: true,
    toJSON: jest.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  const mockProvider = {
    providerName: PaymentMethod.BKASH,
    initiatePayment: jest.fn().mockResolvedValue({
      transactionId: 'TXN_SHK_123',
      gatewayPaymentUrl: 'https://payment.shikkhok.ai/checkout/bkash',
    }),
    verifyPayment: jest.fn(),
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        PaymentStateMachineService,
        {
          provide: SubscriptionPlanRepository,
          useValue: {
            createPlan: jest.fn(),
            findPublished: jest.fn().mockResolvedValue([mockPlan as any]),
            findById: jest.fn(),
            findByCode: jest.fn(),
          },
        },
        {
          provide: StudentSubscriptionRepository,
          useValue: {
            findActiveByUserId: jest.fn(),
            activateSubscription: jest.fn(),
            deactivatePreviousSubscriptions: jest.fn(),
          },
        },
        {
          provide: PaymentTransactionRepository,
          useValue: {
            createTransaction: jest.fn(),
            findByTransactionId: jest.fn(),
            findByManualTrxId: jest.fn(),
            updateStatus: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
        {
          provide: PaymentProviderRegistry,
          useValue: {
            getProvider: jest.fn().mockReturnValue(mockProvider),
          },
        },
        {
          provide: SubscriptionActivationService,
          useValue: {
            activateFromPayment: jest.fn(),
            rejectPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
    planRepository = module.get(SubscriptionPlanRepository);
    subscriptionRepository = module.get(StudentSubscriptionRepository);
    transactionRepository = module.get(PaymentTransactionRepository);
    activationService = module.get(SubscriptionActivationService);
  });

  it('should reject verification if user is not transaction owner (Ownership enforcement)', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      userId: new Types.ObjectId(studentUserId),
      transactionId: 'TXN_SHK_123',
      status: PaymentStatus.PENDING,
    } as any);

    await expect(
      service.verifyPayment(attackerUser, { transactionId: 'TXN_SHK_123' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject manual payment if TrxID was already submitted for same provider (Duplicate TrxID protection)', async () => {
    planRepository.findById.mockResolvedValue(mockPlan as any);
    transactionRepository.findByManualTrxId.mockResolvedValue({
      _id: new Types.ObjectId(),
      manualTrxId: '9J78K4L1P',
    } as any);

    await expect(
      service.submitManualPayment(studentUser, {
        planId: mockPlan._id.toString(),
        paymentMethod: PaymentMethod.BKASH,
        senderNumber: '01712345678',
        manualTrxId: '9J78K4L1P',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should submit manual payment as PENDING_VERIFICATION without activating subscription', async () => {
    planRepository.findById.mockResolvedValue(mockPlan as any);
    transactionRepository.findByManualTrxId.mockResolvedValue(null);
    transactionRepository.createTransaction.mockResolvedValue({
      transactionId: 'MANUAL_SHK_123',
      status: PaymentStatus.PENDING_VERIFICATION,
      senderNumber: '01712345678',
      manualTrxId: '9J78K4L1P',
      toJSON: () => ({
        transactionId: 'MANUAL_SHK_123',
        status: PaymentStatus.PENDING_VERIFICATION,
      }),
    } as any);

    const result = await service.submitManualPayment(studentUser, {
      planId: mockPlan._id.toString(),
      paymentMethod: PaymentMethod.BKASH,
      senderNumber: '01712345678',
      manualTrxId: '9J78K4L1P',
    });

    expect(result.status).toBe(PaymentStatus.PENDING_VERIFICATION);
    expect(result.message).toContain('অ্যাডমিন ভেরিফিকেশনের পর');
    // Ensure subscription activation was NOT called!
    expect(activationService.activateFromPayment).not.toHaveBeenCalled();
    expect(subscriptionRepository.activateSubscription).not.toHaveBeenCalled();
  });

  it('should not mark payment completed if provider verification fails', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      userId: new Types.ObjectId(studentUserId),
      transactionId: 'TXN_SHK_123',
      paymentMethod: PaymentMethod.BKASH,
      status: PaymentStatus.PENDING,
      toJSON: () => ({ transactionId: 'TXN_SHK_123', status: PaymentStatus.PENDING }),
    } as any);

    mockProvider.verifyPayment.mockResolvedValue({
      isSuccess: false,
      failureReason: 'Payment not found in gateway',
    });

    const result = await service.verifyPayment(studentUser, { transactionId: 'TXN_SHK_123' });
    expect(result.isVerified).toBe(false);
    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(activationService.activateFromPayment).not.toHaveBeenCalled();
  });

  it('should activate subscription when provider verification succeeds', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      userId: new Types.ObjectId(studentUserId),
      transactionId: 'TXN_SHK_123',
      paymentMethod: PaymentMethod.BKASH,
      status: PaymentStatus.PENDING,
      toJSON: () => ({ transactionId: 'TXN_SHK_123', status: PaymentStatus.PENDING }),
    } as any);

    mockProvider.verifyPayment.mockResolvedValue({
      isSuccess: true,
      providerTransactionId: 'BK_TRX_999',
      amountBdt: 199,
      currency: 'BDT',
    });

    activationService.activateFromPayment.mockResolvedValue({
      isAlreadyActive: false,
      subscription: {
        _id: new Types.ObjectId(),
        tier: SubscriptionTier.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        toJSON: () => ({ tier: SubscriptionTier.PREMIUM, status: SubscriptionStatus.ACTIVE }),
      } as any,
      transaction: {
        transactionId: 'TXN_SHK_123',
        status: PaymentStatus.COMPLETED,
        toJSON: () => ({ status: PaymentStatus.COMPLETED }),
      } as any,
    });

    const result = await service.verifyPayment(studentUser, { transactionId: 'TXN_SHK_123' });
    expect(result.isVerified).toBe(true);
    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(activationService.activateFromPayment).toHaveBeenCalledWith(
      'TXN_SHK_123',
      'provider:bkash',
      'BK_TRX_999',
      expect.any(String),
    );
  });
});
