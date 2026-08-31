import { ForbiddenException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/register-device-token.dto';
import {
  NotificationPageCursor,
  NotificationRepository,
} from './repositories/notification.repository';
import { DeviceTokenRepository } from './repositories/device-token.repository';
import { PaginatedResult } from '../../common/types/paginated-result.type';

export interface PaginatedNotifications extends PaginatedResult<Record<string, unknown>> {}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly deviceTokenRepository: DeviceTokenRepository,
    private readonly usersService: UsersService,
    @Optional()
    @InjectQueue('notifications')
    private readonly notificationsQueue?: Queue,
  ) {}

  async getMyNotifications(
    currentUser: AuthenticatedUser,
    limit = 20,
    cursor?: string,
  ): Promise<PaginatedNotifications> {
    await this.assertAuthenticated(currentUser);
    const pageLimit = Math.max(1, Math.min(limit || 20, 50));
    const decodedCursor = this.decodeCursor(cursor);
    const notifications = await this.notificationRepository.findPageByUserId(
      currentUser.userId,
      pageLimit + 1,
      decodedCursor,
    );
    const hasNext = notifications.length > pageLimit;
    const data = notifications.slice(0, pageLimit).map((notification) => notification.toJSON());
    const lastItem = data[data.length - 1];
    return {
      data,
      meta: {
        nextCursor:
          hasNext && lastItem
            ? this.encodeCursor(new Date(lastItem.createdAt).toISOString(), lastItem._id.toString())
            : null,
        hasNext,
      },
    };
  }

  async getMyUnreadCount(currentUser: AuthenticatedUser): Promise<{ unreadCount: number }> {
    await this.assertAuthenticated(currentUser);
    const unreadCount = await this.notificationRepository.countUnreadByUserId(currentUser.userId);
    return { unreadCount };
  }

  async markMyNotificationAsRead(
    currentUser: AuthenticatedUser,
    notificationId: string,
  ): Promise<Record<string, any>> {
    await this.assertAuthenticated(currentUser);
    const notification = await this.notificationRepository.markAsRead(
      currentUser.userId,
      notificationId,
    );
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification.toJSON();
  }

  async markAllMyNotificationsAsRead(currentUser: AuthenticatedUser): Promise<{ message: string }> {
    await this.assertAuthenticated(currentUser);
    await this.notificationRepository.markAllAsRead(currentUser.userId);
    return { message: 'All notifications marked as read' };
  }

  async registerDeviceToken(
    currentUser: AuthenticatedUser,
    dto: RegisterDeviceTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.assertAuthenticated(currentUser);
    await this.deviceTokenRepository.registerToken(
      currentUser.userId,
      dto.token,
      dto.platform,
      dto.appVersion,
      dto.deviceModel,
    );
    return { success: true, message: 'Device token registered successfully' };
  }

  async unregisterDeviceToken(
    currentUser: AuthenticatedUser,
    dto: UnregisterDeviceTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.assertAuthenticated(currentUser);
    await this.deviceTokenRepository.unregisterToken(currentUser.userId, dto.token);
    return { success: true, message: 'Device token unregistered successfully' };
  }

  async createNotificationForUser(
    userId: string,
    dto: CreateNotificationDto,
  ): Promise<Record<string, any>> {
    const notification = await this.notificationRepository.createNotification({
      userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      payload: dto.payload,
    });

    const result = notification.toJSON();

    // Enqueue push notification background delivery job
    if (this.notificationsQueue) {
      try {
        await this.notificationsQueue.add(
          'PUSH_NOTIFICATION',
          {
            jobType: 'PUSH_NOTIFICATION',
            data: {
              notificationId: result._id?.toString?.() ?? result._id,
              userId,
              title: dto.title,
              body: dto.body,
              payload: dto.payload || {},
              type: dto.type,
            },
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
          },
        );
      } catch (queueErr: any) {
        this.logger.warn(
          `Failed to enqueue push notification job for user ${userId}: ${queueErr.message}`,
        );
      }
    }

    return result;
  }

  async createNotificationForCurrentUser(
    currentUser: AuthenticatedUser,
    dto: CreateNotificationDto,
  ): Promise<Record<string, any>> {
    await this.assertAuthenticated(currentUser);
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin accounts can create notifications for themselves');
    }
    return this.createNotificationForUser(currentUser.userId, dto);
  }

  private encodeCursor(createdAt: string, id: string): string {
    return Buffer.from(JSON.stringify({ createdAt, id }), 'utf8').toString('base64url');
  }

  private decodeCursor(cursor?: string): NotificationPageCursor | undefined {
    if (!cursor) {
      return undefined;
    }

    try {
      const decoded = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as NotificationPageCursor;
      if (decoded?.createdAt && decoded?.id) {
        return decoded;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private async assertAuthenticated(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!Object.values(UserRole).includes(user.role)) {
      throw new ForbiddenException('Invalid user role');
    }
  }
}
