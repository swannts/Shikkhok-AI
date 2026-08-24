import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { SyncEventRepository } from './repositories/sync-event.repository';
import { SyncDeviceCheckpointRepository } from './repositories/sync-device-checkpoint.repository';
import {
  SubmitSyncBatchDto,
  SubmitSyncBatchResponseDto,
  SyncOperationDto,
  SyncOperationResultDto,
} from './dto/submit-sync-batch.dto';
import { SyncOperationType } from './enums/sync-operation-type.enum';
import { SyncEventStatus } from './enums/sync-event-status.enum';
import { ProgressService } from '../progress/progress.service';
import { StudyPlanService } from '../study-plan/study-plan.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly syncEventRepository: SyncEventRepository,
    private readonly syncDeviceCheckpointRepository: SyncDeviceCheckpointRepository,
    private readonly progressService: ProgressService,
    private readonly studyPlanService: StudyPlanService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async submitBatch(
    currentUser: AuthenticatedUser,
    dto: SubmitSyncBatchDto,
  ): Promise<SubmitSyncBatchResponseDto> {
    await this.assertAuthenticated(currentUser);

    const results: SyncOperationResultDto[] = [];
    let appliedCount = 0;
    let replayedCount = 0;
    let processingCount = 0;
    let failedCount = 0;

    for (const operation of dto.operations) {
      try {
        // 1. Check if event already exists
        const existing = await this.syncEventRepository.findByOperationId(
          currentUser.userId,
          operation.operationId,
        );

        if (existing?.status === SyncEventStatus.APPLIED) {
          replayedCount++;
          results.push({
            operationId: operation.operationId,
            status: 'replayed',
            result: existing.result ?? { ok: true },
          });
          continue;
        }

        if (existing?.status === SyncEventStatus.PROCESSING) {
          processingCount++;
          results.push({
            operationId: operation.operationId,
            status: 'processing',
            result: null,
          });
          continue;
        }

        // 2. Get or create pending event record
        const created = await this.syncEventRepository.getOrCreatePendingEvent({
          userId: currentUser.userId,
          operationId: operation.operationId,
          operationType: operation.operationType,
          entityType: operation.entityType,
          entityId: operation.entityId ?? null,
          payload: operation.payload,
        });

        if (created.status === SyncEventStatus.APPLIED) {
          replayedCount++;
          results.push({
            operationId: operation.operationId,
            status: 'replayed',
            result: created.result ?? { ok: true },
          });
          continue;
        }

        // 3. Atomically claim event for processing (resets errors, increments retryCount)
        const claimed = await this.syncEventRepository.claimForProcessing(
          currentUser.userId,
          operation.operationId,
        );

        if (!claimed) {
          const current = await this.syncEventRepository.findByOperationId(
            currentUser.userId,
            operation.operationId,
          );

          if (current?.status === SyncEventStatus.APPLIED) {
            replayedCount++;
            results.push({
              operationId: operation.operationId,
              status: 'replayed',
              result: current.result ?? { ok: true },
            });
          } else {
            processingCount++;
            results.push({
              operationId: operation.operationId,
              status: 'processing',
              result: null,
            });
          }
          continue;
        }

        // 4. Operation-level Authorization Verification
        this.assertOperationAuthorized(currentUser, operation);

        // 5. Apply the domain operation
        const result = await this.applyOperation(currentUser, operation);

        // 6. Mark applied
        await this.syncEventRepository.markApplied(
          currentUser.userId,
          operation.operationId,
          result,
        );

        appliedCount++;
        results.push({
          operationId: operation.operationId,
          status: 'applied',
          result,
        });
      } catch (error: any) {
        failedCount++;
        const errorCode =
          error?.response?.error?.code ||
          (error instanceof ForbiddenException
            ? 'FORBIDDEN'
            : error instanceof BadRequestException
              ? 'BAD_REQUEST'
              : 'SYNC_OPERATION_FAILED');
        const errorMessage = error?.message ?? 'Sync operation failed';

        await this.syncEventRepository.markFailed(
          currentUser.userId,
          operation.operationId,
          errorCode,
          errorMessage,
        );

        results.push({
          operationId: operation.operationId,
          status: 'failed',
          errorCode,
          errorMessage,
        });
      }
    }

    // Determine checkpoint status: applied, partial, or failed
    let checkpointStatus = 'applied';
    if (failedCount > 0) {
      if (appliedCount > 0 || replayedCount > 0) {
        checkpointStatus = 'partial';
      } else {
        checkpointStatus = 'failed';
      }
    }

    await this.syncDeviceCheckpointRepository.upsertCheckpoint({
      userId: currentUser.userId,
      deviceId: dto.deviceId,
      lastSyncedAt: new Date(),
      lastOperationId: dto.operations[dto.operations.length - 1]?.operationId ?? null,
      lastBatchSize: dto.operations.length,
      lastStatus: checkpointStatus,
    });

    return {
      summary: {
        received: dto.operations.length,
        applied: appliedCount,
        replayed: replayedCount,
        processing: processingCount,
        failed: failedCount,
      },
      results,
    };
  }

  async getMySyncEvents(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.assertAuthenticated(currentUser);
    const events = await this.syncEventRepository.findByUserId(currentUser.userId);
    return events.map((event) => event.toJSON());
  }

  async getMySyncCheckpoint(
    currentUser: AuthenticatedUser,
    deviceId: string,
  ): Promise<Record<string, any>> {
    await this.assertAuthenticated(currentUser);
    const checkpoint = await this.syncDeviceCheckpointRepository.findByDeviceId(
      currentUser.userId,
      deviceId,
    );
    if (!checkpoint) {
      return {
        deviceId,
        lastSyncedAt: null,
        lastOperationId: null,
        lastBatchSize: 0,
        lastStatus: 'unknown',
      };
    }

    return checkpoint.toJSON();
  }

  private assertOperationAuthorized(
    currentUser: AuthenticatedUser,
    operation: SyncOperationDto,
  ): void {
    switch (operation.operationType) {
      case SyncOperationType.LESSON_PROGRESS_UPSERT:
        if (currentUser.role !== UserRole.STUDENT) {
          throw new ForbiddenException('Only student accounts can update lesson progress');
        }
        break;
      case SyncOperationType.STUDY_PLAN_UPSERT:
        if (currentUser.role !== UserRole.STUDENT) {
          throw new ForbiddenException('Only student accounts can update study plans');
        }
        break;
      case SyncOperationType.NOTIFICATION_MARK_READ:
        // Any authenticated user can mark their own notifications as read
        break;
      default:
        throw new BadRequestException('Unsupported sync operation type');
    }
  }

  private async applyOperation(
    currentUser: AuthenticatedUser,
    operation: SyncOperationDto,
  ): Promise<Record<string, any>> {
    switch (operation.operationType) {
      case SyncOperationType.LESSON_PROGRESS_UPSERT:
        if (!operation.payload?.lessonId) {
          throw new BadRequestException('lessonId is required for lesson progress sync');
        }
        return this.progressService.upsertMyLessonProgress(
          currentUser,
          operation.payload.lessonId,
          operation.payload,
        );
      case SyncOperationType.STUDY_PLAN_UPSERT:
        return this.studyPlanService.upsertMyCurrentPlan(currentUser, operation.payload as any);
      case SyncOperationType.NOTIFICATION_MARK_READ:
        if (!operation.payload?.notificationId) {
          throw new BadRequestException('notificationId is required for notification sync');
        }
        return this.notificationsService.markMyNotificationAsRead(
          currentUser,
          operation.payload.notificationId,
        );
      default:
        throw new BadRequestException('Unsupported sync operation type');
    }
  }

  private async assertAuthenticated(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.PARENT &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Authenticated account cannot sync data');
    }
  }
}
