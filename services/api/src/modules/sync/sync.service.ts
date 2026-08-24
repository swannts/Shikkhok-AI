import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { SyncEventRepository } from './repositories/sync-event.repository';
import { SyncDeviceCheckpointRepository } from './repositories/sync-device-checkpoint.repository';
import { SubmitSyncBatchDto } from './dto/submit-sync-batch.dto';
import { SyncOperationType } from './enums/sync-operation-type.enum';
import { SyncEventStatus } from './enums/sync-event-status.enum';
import { ProgressService } from '../progress/progress.service';
import { StudyPlanService } from '../study-plan/study-plan.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SyncService {
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
  ): Promise<Record<string, any>> {
    await this.assertAuthenticated(currentUser);

    const results = [];
    for (const operation of dto.operations) {
      try {
        const existing = await this.syncEventRepository.findByOperationId(currentUser.userId, operation.operationId);
        if (existing?.status === SyncEventStatus.APPLIED) {
          results.push(existing.toJSON());
          continue;
        }

        const created = await this.syncEventRepository.getOrCreatePendingEvent({
          userId: currentUser.userId,
          operationId: operation.operationId,
          operationType: operation.operationType,
          entityType: operation.entityType,
          entityId: operation.entityId ?? null,
          payload: operation.payload,
        });

        if (created.status === SyncEventStatus.APPLIED) {
          results.push(created.toJSON());
          continue;
        }

        const claimed = await this.syncEventRepository.claimForProcessing(
          currentUser.userId,
          operation.operationId,
        );

        if (!claimed) {
          const current = await this.syncEventRepository.findByOperationId(
            currentUser.userId,
            operation.operationId,
          );
          if (current) {
            results.push(current.toJSON());
          }
          continue;
        }

        const result = await this.applyOperation(currentUser, operation);
        const updated = await this.syncEventRepository.markApplied(
          currentUser.userId,
          operation.operationId,
          result,
        );
        if (updated) {
          results.push(updated.toJSON());
        }
      } catch (error: any) {
        const safeMessage = error?.message ?? 'Unknown sync error';
        await this.syncEventRepository.markFailed(
          currentUser.userId,
          operation.operationId,
          error?.name === 'BadRequestException' ? 'bad_request' : 'sync_failed',
          safeMessage,
        );
        throw new BadRequestException(`Sync operation failed for ${operation.operationId}: ${safeMessage}`);
      }
    }

    await this.syncDeviceCheckpointRepository.upsertCheckpoint({
      userId: currentUser.userId,
      deviceId: dto.deviceId,
      lastSyncedAt: new Date(),
      lastOperationId: dto.operations[dto.operations.length - 1]?.operationId ?? null,
      lastBatchSize: dto.operations.length,
      lastStatus: 'applied',
    });

    return {
      appliedOperations: dto.operations.length,
      results,
    };
  }

  async getMySyncEvents(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.assertAuthenticated(currentUser);
    const events = await this.syncEventRepository.findByUserId(currentUser.userId);
    return events.map((event) => event.toJSON());
  }

  async getMySyncCheckpoint(currentUser: AuthenticatedUser, deviceId: string): Promise<Record<string, any>> {
    await this.assertAuthenticated(currentUser);
    const checkpoint = await this.syncDeviceCheckpointRepository.findByDeviceId(currentUser.userId, deviceId);
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

  private async applyOperation(currentUser: AuthenticatedUser, operation: any): Promise<Record<string, any>> {
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
        return this.studyPlanService.upsertMyCurrentPlan(currentUser, operation.payload);
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

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Authenticated account cannot sync data');
    }
  }
}
