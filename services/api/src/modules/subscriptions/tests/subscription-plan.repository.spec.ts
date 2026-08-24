import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';
import { SubscriptionPlan } from '../schemas/subscription-plan.schema';
import { SubscriptionTier } from '../enums/subscription-tier.enum';
import { BillingCycle } from '../enums/billing-cycle.enum';

describe('SubscriptionPlanRepository', () => {
  let repository: SubscriptionPlanRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.find = jest.fn();
    model.findById = jest.fn();
    model.findOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanRepository,
        {
          provide: getModelToken(SubscriptionPlan.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(SubscriptionPlanRepository);
  });

  it('should create a subscription plan record', async () => {
    const result = await repository.createPlan({
      code: 'PREMIUM_MONTHLY',
      name: 'Premium Monthly',
      nameBn: 'প্রিমিয়াম মাসিক প্ল্যান',
      tier: SubscriptionTier.PREMIUM,
      billingCycle: BillingCycle.MONTHLY,
      priceBdt: 199,
      durationDays: 30,
      isPublished: true,
    });

    expect(result).toBeDefined();
    expect(result.code).toBe('PREMIUM_MONTHLY');
  });

  it('should find published plans ordered by price', async () => {
    const mockExec = jest
      .fn()
      .mockResolvedValue([{ code: 'FREE_TIER' }, { code: 'PREMIUM_MONTHLY' }]);
    const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
    model.find.mockReturnValue({ sort: mockSort });

    const plans = await repository.findPublished();
    expect(plans).toHaveLength(2);
    expect(model.find).toHaveBeenCalledWith({ isPublished: true });
  });
});
