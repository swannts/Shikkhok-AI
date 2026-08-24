import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { SyncEventRepository } from './repositories/sync-event.repository';
import { SubmitSyncBatchDto } from './dto/submit-sync-batch.dto';
import { SyncOperationType } from './enums/sync-operation-type.enum';
import { ProgressService } from '../progress/progress.service';
import { StudyPlanService } from '../study-plan/study-plan.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly syncEventRepository: SyncEventRepository,
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
      const existing = await this.syncEventRepository.findByOperationId(
        currentUser.userId,
        operation.operationId,
      );
      if (existing) {
        results.push(existing.toJSON());
        continue;
      }

      const event = await this.syncEventRepository.createEvent({
        userId: currentUser.userId as any,
        operationId: operation.operationId,
        operationType: operation.operationType,
        entityType: operation.entityType,
        entityId: operation.entityId ?? null,
        payload: operation.payload,
        status: 'pending',
      });

      try {
        const result = await this.applyOperation(currentUser, operation);
        const updated = await this.syncEventRepository.createEvent({
          userId: currentUser.userId as any,
          operationId: `${operation.operationId}:applied`,
          operationType: operation.operationType,
          entityType: operation.entityType,
          entityId: operation.entityId ?? null,
          payload: operation.payload,
          status: 'applied',
          result,
          appliedAt: new Date(),
        });
        results.push(updated.toJSON());
      } catch (error: any) {
        throw new BadRequestException(`Sync operation failed for ${operation.operationId}: ${error?.message ?? error}`);
      }
    }

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
