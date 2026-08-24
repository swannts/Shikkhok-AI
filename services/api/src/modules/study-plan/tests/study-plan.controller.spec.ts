import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { StudyPlanController } from '../study-plan.controller';
import { StudyPlanService } from '../study-plan.service';
import { UserRole } from '../../users/enums/user-role.enum';

describe('StudyPlanController', () => {
  let controller: StudyPlanController;
  let service: jest.Mocked<StudyPlanService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyPlanController],
      providers: [
        {
          provide: StudyPlanService,
          useValue: {
            getMyCurrentPlan: jest.fn(),
            getMyHistory: jest.fn(),
            upsertMyCurrentPlan: jest.fn(),
            generateRecommendedPlan: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(StudyPlanController);
    service = module.get(StudyPlanService);
  });

  it('should expose current plan endpoint', async () => {
    service.getMyCurrentPlan.mockResolvedValue({ title: 'Plan' } as any);
    const result = await controller.getMyCurrentPlan({ userId: 'user-1', role: UserRole.STUDENT });
    expect(result.title).toBe('Plan');
  });
});
