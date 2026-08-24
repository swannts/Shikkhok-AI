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
import { SyncEventStatus } from '../enums/sync-event-status.enum';
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

  it('should successfully apply valid lesson progress sync for a student', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findByOperationId.mockResolvedValue(null);
    repo.getOrCreatePendingEvent.mockResolvedValue({ status: SyncEventStatus.PENDING } as any);
    repo.claimForProcessing.mockResolvedValue({ status: SyncEventStatus.PROCESSING } as any);
    repo.markApplied.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ status: 'applied' }),
    } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);
    progressService.upsertMyLessonProgress.mockResolvedValue({ ok: true } as any);

    const response = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-1',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: {
              lessonId: 'lesson-1',
              progressPercent: 50,
              classLevel: 8,
              medium: 'bangla',
              curriculumYear: 2026,
            },
          },
        ],
      },
    );

    expect(response.summary).toEqual({
      received: 1,
      applied: 1,
      replayed: 0,
      processing: 0,
      failed: 0,
    });
    expect(response.results[0]).toEqual({
      operationId: 'op-1',
      status: 'applied',
      result: { ok: true },
    });
    expect(checkpointRepo.upsertCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1',
        lastStatus: 'applied',
      }),
    );
  });

  it('should successfully apply valid study plan sync for a student', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findByOperationId.mockResolvedValue(null);
    repo.getOrCreatePendingEvent.mockResolvedValue({ status: SyncEventStatus.PENDING } as any);
    repo.claimForProcessing.mockResolvedValue({ status: SyncEventStatus.PROCESSING } as any);
    repo.markApplied.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ status: 'applied' }),
    } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);
    studyPlanService.upsertMyCurrentPlan.mockResolvedValue({ id: 'plan-1' } as any);

    const response = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-plan-1',
            operationType: SyncOperationType.STUDY_PLAN_UPSERT,
            entityType: 'study_plan',
            payload: {
              title: 'সাপ্তাহিক পরিকল্পনা',
              classLevel: 8,
              medium: 'bangla',
              curriculumYear: 2026,
            },
          },
        ],
      },
    );

    expect(response.summary.applied).toBe(1);
    expect(studyPlanService.upsertMyCurrentPlan).toHaveBeenCalled();
  });

  it('should process operations independently and continue batch when one operation fails (partial batch)', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findByOperationId.mockResolvedValue(null);
    repo.getOrCreatePendingEvent.mockResolvedValue({ status: SyncEventStatus.PENDING } as any);
    repo.claimForProcessing.mockResolvedValue({ status: SyncEventStatus.PROCESSING } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);

    // Op 1 fails: missing lessonId
    // Op 2 succeeds: notification mark read
    notificationsService.markMyNotificationAsRead.mockResolvedValue({ success: true } as any);

    const response = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-fail-1',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: {}, // Missing lessonId -> throws BadRequestException
          },
          {
            operationId: 'op-success-2',
            operationType: SyncOperationType.NOTIFICATION_MARK_READ,
            entityType: 'notification',
            payload: { notificationId: 'notif-123' },
          },
        ],
      },
    );

    expect(response.summary).toEqual({
      received: 2,
      applied: 1,
      replayed: 0,
      processing: 0,
      failed: 1,
    });

    expect(response.results[0].operationId).toBe('op-fail-1');
    expect(response.results[0].status).toBe('failed');
    expect(response.results[0].errorCode).toBe('BAD_REQUEST');
    expect(repo.markFailed).toHaveBeenCalledWith(
      'user-1',
      'op-fail-1',
      'BAD_REQUEST',
      expect.any(String),
    );

    expect(response.results[1].operationId).toBe('op-success-2');
    expect(response.results[1].status).toBe('applied');

    // Checkpoint must reflect partial status
    expect(checkpointRepo.upsertCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1',
        lastStatus: 'partial',
      }),
    );
  });

  it('should enforce operation-level authorization: parent cannot mutate lesson progress or study plans', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    repo.findByOperationId.mockResolvedValue(null);
    repo.getOrCreatePendingEvent.mockResolvedValue({ status: SyncEventStatus.PENDING } as any);
    repo.claimForProcessing.mockResolvedValue({ status: SyncEventStatus.PROCESSING } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);

    const response = await service.submitBatch(
      { userId: 'parent-1', role: UserRole.PARENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-parent-progress',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: { lessonId: 'lesson-1' },
          },
          {
            operationId: 'op-parent-plan',
            operationType: SyncOperationType.STUDY_PLAN_UPSERT,
            entityType: 'study_plan',
            payload: { title: 'plan' },
          },
        ],
      },
    );

    expect(response.summary).toEqual({
      received: 2,
      applied: 0,
      replayed: 0,
      processing: 0,
      failed: 2,
    });

    expect(response.results[0].status).toBe('failed');
    expect(response.results[0].errorCode).toBe('FORBIDDEN');
    expect(response.results[1].status).toBe('failed');
    expect(response.results[1].errorCode).toBe('FORBIDDEN');

    // All failed -> checkpoint status is 'failed'
    expect(checkpointRepo.upsertCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1',
        lastStatus: 'failed',
      }),
    );
  });

  it('should replay already-applied sync events without executing domain logic again', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findByOperationId.mockResolvedValue({
      status: SyncEventStatus.APPLIED,
      result: { cached: true },
    } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);

    const response = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-already-done',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: { lessonId: 'lesson-1' },
          },
        ],
      },
    );

    expect(response.summary.replayed).toBe(1);
    expect(response.results[0].status).toBe('replayed');
    expect(response.results[0].result).toEqual({ cached: true });
    expect(progressService.upsertMyLessonProgress).not.toHaveBeenCalled();
    expect(checkpointRepo.upsertCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        lastStatus: 'applied',
      }),
    );
  });

  it('should allow retrying a previously FAILED event and apply it when valid', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    // Previously failed event
    repo.findByOperationId.mockResolvedValue({
      status: SyncEventStatus.FAILED,
      retryCount: 1,
    } as any);
    repo.getOrCreatePendingEvent.mockResolvedValue({ status: SyncEventStatus.FAILED } as any);
    repo.claimForProcessing.mockResolvedValue({ status: SyncEventStatus.PROCESSING } as any);
    progressService.upsertMyLessonProgress.mockResolvedValue({ ok: true } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);

    const response = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-retry-1',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: { lessonId: 'lesson-fixed', progressPercent: 100 },
          },
        ],
      },
    );

    expect(response.summary.applied).toBe(1);
    expect(response.results[0].status).toBe('applied');
    expect(repo.claimForProcessing).toHaveBeenCalledWith('user-1', 'op-retry-1');
    expect(repo.markApplied).toHaveBeenCalledWith('user-1', 'op-retry-1', { ok: true });
  });

  it('should handle concurrent duplicate processing by returning status processing', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    // Already processing
    repo.findByOperationId.mockResolvedValue({
      status: SyncEventStatus.PROCESSING,
    } as any);
    checkpointRepo.upsertCheckpoint.mockResolvedValue({} as any);

    const response = await service.submitBatch(
      { userId: 'user-1', role: UserRole.STUDENT },
      {
        deviceId: 'device-1',
        operations: [
          {
            operationId: 'op-concurrent',
            operationType: SyncOperationType.LESSON_PROGRESS_UPSERT,
            entityType: 'lesson_progress',
            payload: { lessonId: 'lesson-1' },
          },
        ],
      },
    );

    expect(response.summary.processing).toBe(1);
    expect(response.results[0].status).toBe('processing');
    expect(progressService.upsertMyLessonProgress).not.toHaveBeenCalled();
  });

  it('should return checkpoint information or default values for a device', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    checkpointRepo.findByDeviceId.mockResolvedValue(null);

    const defaultCheckpoint = await service.getMySyncCheckpoint(
      { userId: 'user-1', role: UserRole.STUDENT },
      'device-new',
    );

    expect(defaultCheckpoint).toEqual({
      deviceId: 'device-new',
      lastSyncedAt: null,
      lastOperationId: null,
      lastBatchSize: 0,
      lastStatus: 'unknown',
    });
  });
});
