import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { SubscriptionActivationService } from '../services/subscription-activation.service';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from '../repositories/student-subscription.repository';
import { PaymentStateMachineService } from '../services/payment-state-machine.service';
import { PaymentStatus } from '../enums/payment-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { SubscriptionTier } from '../enums/subscription-tier.enum';

describe('SubscriptionActivationService', () => {
  let service: SubscriptionActivationService;
  let transactionRepository: jest.Mocked<PaymentTransactionRepository>;
  let planRepository: jest.Mocked<SubscriptionPlanRepository>;
  let subscriptionRepository: jest.Mocked<StudentSubscriptionRepository>;

  const userId = new Types.ObjectId();
  const planId = new Types.ObjectId();

  const mockPlan = {
    _id: planId,
    code: 'PREMIUM_MONTHLY',
    tier: SubscriptionTier.PREMIUM,
    durationDays: 30,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionActivationService,
        PaymentStateMachineService,
        {
          provide: PaymentTransactionRepository,
          useValue: {
            findByTransactionId: jest.fn(),
            updateVerification: jest.fn(),
          },
        },
        {
          provide: SubscriptionPlanRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: StudentSubscriptionRepository,
          useValue: {
            findActiveByUserId: jest.fn(),
            deactivatePreviousSubscriptions: jest.fn(),
            activateSubscription: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionActivationService);
    transactionRepository = module.get(PaymentTransactionRepository);
    planRepository = module.get(SubscriptionPlanRepository);
    subscriptionRepository = module.get(StudentSubscriptionRepository);
  });

  it('should activate subscription when transaction is in PENDING status', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      userId,
      planId,
      transactionId: 'TXN_SHK_1',
      status: PaymentStatus.PENDING,
      save: jest.fn(),
    } as any);

    planRepository.findById.mockResolvedValue(mockPlan as any);

    transactionRepository.updateVerification.mockResolvedValue({
      transactionId: 'TXN_SHK_1',
      status: PaymentStatus.COMPLETED,
      save: jest.fn(),
    } as any);

    subscriptionRepository.activateSubscription.mockResolvedValue({
      _id: new Types.ObjectId(),
      userId,
      planId,
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
    } as any);

    const result = await service.activateFromPayment('TXN_SHK_1', 'provider:bkash', 'BK_123');
    expect(result.isAlreadyActive).toBe(false);
    expect(result.subscription.tier).toBe(SubscriptionTier.PREMIUM);
    expect(subscriptionRepository.deactivatePreviousSubscriptions).toHaveBeenCalledWith(
      userId.toString(),
    );
  });

  it('should return existing subscription idempotently if transaction was already completed', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      userId,
      planId,
      transactionId: 'TXN_SHK_ALREADY_DONE',
      status: PaymentStatus.COMPLETED,
    } as any);

    subscriptionRepository.findActiveByUserId.mockResolvedValue({
      _id: new Types.ObjectId(),
      paymentTransactionId: 'TXN_SHK_ALREADY_DONE',
      status: SubscriptionStatus.ACTIVE,
    } as any);

    const result = await service.activateFromPayment('TXN_SHK_ALREADY_DONE', 'provider:webhook');
    expect(result.isAlreadyActive).toBe(true);
    expect(subscriptionRepository.activateSubscription).not.toHaveBeenCalled();
  });

  it('should transition transaction to FAILED on rejectPayment', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      userId,
      planId,
      transactionId: 'MANUAL_TXN_REJECT',
      status: PaymentStatus.PENDING_VERIFICATION,
    } as any);

    transactionRepository.updateVerification.mockResolvedValue({
      transactionId: 'MANUAL_TXN_REJECT',
      status: PaymentStatus.FAILED,
      failureCode: 'MANUAL_REJECTION',
    } as any);

    const result = await service.rejectPayment(
      'MANUAL_TXN_REJECT',
      'admin:123',
      'Fake TrxID provided',
    );
    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(subscriptionRepository.activateSubscription).not.toHaveBeenCalled();
  });
});
