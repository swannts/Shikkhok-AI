import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudyPlan } from '../schemas/study-plan.schema';
import { StudyPlanRepository } from '../repositories/study-plan.repository';

describe('StudyPlanRepository', () => {
  let repository: StudyPlanRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFindOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation(() => ({}));
    (MockModel as any).findOne = mockFindOne;
    (MockModel as any).find = mockFind;
    (MockModel as any).findOneAndUpdate = mockFindOneAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyPlanRepository,
        { provide: getModelToken(StudyPlan.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(StudyPlanRepository);
    model = module.get(getModelToken(StudyPlan.name));
  });

  it('should upsert the current plan', async () => {
    const plan = { toJSON: jest.fn().mockReturnValue({ title: 'Plan' }) };
    model.findOneAndUpdate().exec.mockResolvedValue(plan);

    const result = await repository.upsertCurrentPlan('user-1', { title: 'Plan', status: 'active' as any });

    expect(result).toEqual(plan);
  });
});
