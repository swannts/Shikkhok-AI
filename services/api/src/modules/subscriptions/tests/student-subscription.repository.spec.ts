import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { StudentSubscriptionRepository } from '../repositories/student-subscription.repository';
import { StudentSubscription } from '../schemas/student-subscription.schema';
import { SubscriptionTier } from '../enums/subscription-tier.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

describe('StudentSubscriptionRepository', () => {
  let repository: StudentSubscriptionRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.findOne = jest.fn();
    model.updateMany = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentSubscriptionRepository,
        {
          provide: getModelToken(StudentSubscription.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(StudentSubscriptionRepository);
  });

  it('should find active subscription for student', async () => {
    const studentId = new Types.ObjectId().toString();
    const mockExec = jest.fn().mockResolvedValue({
      userId: new Types.ObjectId(studentId),
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
    });
    const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
    model.findOne.mockReturnValue({ sort: mockSort });

    const result = await repository.findActiveByUserId(studentId);
    expect(result).toBeDefined();
    expect(result?.tier).toBe(SubscriptionTier.PREMIUM);
  });
});
