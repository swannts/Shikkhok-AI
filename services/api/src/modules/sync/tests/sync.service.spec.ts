import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '../sync.service';
import { SyncEventRepository } from '../repositories/sync-event.repository';
import { ProgressService } from '../../progress/progress.service';
import { StudyPlanService } from '../../study-plan/study-plan.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { SyncOperationType } from '../enums/sync-operation-type.enum';
import { SyncDeviceCheckpointRepository } from '../repositories/sync-device-checkpoint.repository';

describe('SyncService', () => {
  let service: SyncService;
  let repo: jest.Mocked<SyncEventRepository>;
  let progressService: jest.Mocked<ProgressService>;
  let studyPlanService: jest.Mocked<StudyPlanService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let usersService: jest.Mocked<UsersService>;
  let checkpointRepo: jest.Mocked<SyncDeviceCheckpointRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: SyncEventRepository,
          useValue: {
            createEvent: jest.fn(),
            findByOperationId: jest.fn(),
            findByUserId: jest.fn(),
            getOrCreatePendingEvent: jest.fn(),
            claimForProcessing: jest.fn(),
            markApplied: jest.fn(),
            markFailed: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            upsertMyLessonProgress: jest.fn(),
          },
        },
        {
          provide: StudyPlanService,
          useValue: {
            upsertMyCurrentPlan: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            markMyNotificationAsRead: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: SyncDeviceCheckpointRepository,
          useValue: {
            upsertCheckpoint: jest.fn(),
            findByDeviceId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SyncService);
    repo = module.get(SyncEventRepository);
    progressService = module.get(ProgressService);
    studyPlanService = module.get(StudyPlanService);
    notificationsService = module.get(NotificationsService);
    usersService = module.get(UsersService);
    checkpointRepo = module.get(SyncDeviceCheckpointRepository);
  });

  it('should apply lesson progress sync', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findByOperationId.mockResolvedValue(null);
    repo.getOrCreatePendingEvent.mockResolvedValue({ status: 'pending' } as any);
    repo.claimForProcessing.mockResolvedValue({ status: 'processing' } as any);
    repo.markApplied.mockResolvedValue({ toJSON: jest.fn().mockReturnValue({ status: 'applied' }) } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);
    progressService.upsertMyLessonProgress.mockResolvedValue({ ok: true } as any);

    const result = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-1',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: { lessonId: 'lesson-1', progressPercent: 50, classLevel: 8, medium: 'bangla', curriculumYear: 2026 },
          },
        ],
      },
    );

    expect(result.appliedOperations).toBe(1);
    expect(progressService.upsertMyLessonProgress).toHaveBeenCalled();
    expect(checkpointRepo.upsertCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1',
        lastStatus: 'applied',
      }),
    );
  });
});
