import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from '../repositories/student-subscription.repository';
import { PaymentTransactionRepository } from '../repositories/payment-transaction.repository';
import { SubscriptionTier } from '../enums/subscription-tier.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { UserRole } from '../../users/enums/user-role.enum';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let planRepository: jest.Mocked<SubscriptionPlanRepository>;
  let subscriptionRepository: jest.Mocked<StudentSubscriptionRepository>;
  let transactionRepository: jest.Mocked<PaymentTransactionRepository>;

  const studentUserId = new Types.ObjectId().toString();
  const studentUser = { userId: studentUserId, role: UserRole.STUDENT };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
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
            updateStatus: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
    planRepository = module.get(SubscriptionPlanRepository);
    subscriptionRepository = module.get(StudentSubscriptionRepository);
    transactionRepository = module.get(PaymentTransactionRepository);
  });

  it('should list published subscription plans', async () => {
    const plans = await service.listPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].code).toBe('PREMIUM_MONTHLY');
  });

  it('should return default free starter tier when student has no active subscription', async () => {
    subscriptionRepository.findActiveByUserId.mockResolvedValue(null);
    const sub = await service.getMySubscription(studentUser);
    expect(sub.tier).toBe(SubscriptionTier.FREE);
    expect(sub.isPremium).toBe(false);
  });

  it('should initiate bKash payment checkout session with transaction ID', async () => {
    planRepository.findById.mockResolvedValue(mockPlan as any);
    transactionRepository.createTransaction.mockResolvedValue({
      transactionId: 'TXN_SHK_TEST_123',
      amountBdt: 199,
      status: PaymentStatus.PENDING,
      toJSON: () => ({ transactionId: 'TXN_SHK_TEST_123', amountBdt: 199 }),
    } as any);

    const result = await service.initiatePayment(studentUser, {
      planId: mockPlan._id.toString(),
      paymentMethod: PaymentMethod.BKASH,
    });

    expect(result.transactionId).toBeDefined();
    expect(result.amountBdt).toBe(199);
    expect(result.gatewayPaymentUrl).toContain('bkash');
  });

  it('should verify payment and activate premium subscription', async () => {
    transactionRepository.findByTransactionId.mockResolvedValue({
      transactionId: 'TXN_SHK_123',
      planId: mockPlan._id,
      status: PaymentStatus.PENDING,
    } as any);
    planRepository.findById.mockResolvedValue(mockPlan as any);
    transactionRepository.updateStatus.mockResolvedValue({
      transactionId: 'TXN_SHK_123',
      status: PaymentStatus.COMPLETED,
      toJSON: () => ({ transactionId: 'TXN_SHK_123', status: PaymentStatus.COMPLETED }),
    } as any);
    subscriptionRepository.activateSubscription.mockResolvedValue({
      _id: new Types.ObjectId(),
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      toJSON: () => ({ tier: SubscriptionTier.PREMIUM, status: SubscriptionStatus.ACTIVE }),
    } as any);

    const result = await service.verifyPayment(studentUser, { transactionId: 'TXN_SHK_123' });
    expect(result.subscription).toBeDefined();
    expect(result.subscription.tier).toBe(SubscriptionTier.PREMIUM);
    expect(subscriptionRepository.deactivatePreviousSubscriptions).toHaveBeenCalledWith(
      studentUserId,
    );
  });

  it('should submit manual bKash payment and activate subscription', async () => {
    planRepository.findById.mockResolvedValue(mockPlan as any);
    transactionRepository.createTransaction.mockResolvedValue({
      transactionId: 'MANUAL_SHK_123',
      status: PaymentStatus.COMPLETED,
      senderNumber: '01712345678',
      manualTrxId: '9J78K4L1P',
      toJSON: () => ({ transactionId: 'MANUAL_SHK_123', manualTrxId: '9J78K4L1P' }),
    } as any);
    subscriptionRepository.activateSubscription.mockResolvedValue({
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      toJSON: () => ({ tier: SubscriptionTier.PREMIUM }),
    } as any);

    const result = await service.submitManualPayment(studentUser, {
      planId: mockPlan._id.toString(),
      paymentMethod: PaymentMethod.BKASH,
      senderNumber: '01712345678',
      manualTrxId: '9J78K4L1P',
    });

    expect(result.subscription).toBeDefined();
    expect(result.transaction.manualTrxId).toBe('9J78K4L1P');
  });
});
