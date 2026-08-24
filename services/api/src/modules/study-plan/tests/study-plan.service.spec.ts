import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudyPlanService } from '../study-plan.service';
import { StudyPlanRepository } from '../repositories/study-plan.repository';
import { StudentsService } from '../../students/students.service';
import { ProgressService } from '../../progress/progress.service';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';

describe('StudyPlanService', () => {
  let service: StudyPlanService;
  let repo: jest.Mocked<StudyPlanRepository>;
  let studentsService: jest.Mocked<StudentsService>;
  let progressService: jest.Mocked<ProgressService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyPlanService,
        {
          provide: StudyPlanRepository,
          useValue: {
            findCurrentByUserId: jest.fn(),
            findHistoryByUserId: jest.fn(),
            upsertCurrentPlan: jest.fn(),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getSummaryForUserId: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StudyPlanService);
    repo = module.get(StudyPlanRepository);
    studentsService = module.get(StudentsService);
    progressService = module.get(ProgressService);
    usersService = module.get(UsersService);
  });

  it('should generate a plan from student progress', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    studentsService.getProfileByUserId.mockResolvedValue({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    } as any);
    progressService.getSummaryForUserId.mockResolvedValue({
      averageMastery: 40,
      subjects: [{ subjectId: 'sub-1', averageMastery: 30 }],
    } as any);
    repo.upsertCurrentPlan.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ title: 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা' }),
    } as any);

    const result = await service.generateRecommendedPlan({
      userId: 'user-1',
      role: UserRole.STUDENT,
    });

    expect(result.title).toBe('সাপ্তাহিক অধ্যয়ন পরিকল্পনা');
  });

  it('should throw when current plan is missing', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findCurrentByUserId.mockResolvedValue(null);

    await expect(service.getMyCurrentPlan({ userId: 'user-1', role: UserRole.STUDENT })).rejects.toThrow(
      NotFoundException,
    );
  });
});
