import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationRepository } from './repositories/notification.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly usersService: UsersService,
  ) {}

  async getMyNotifications(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.assertAuthenticated(currentUser);
    const notifications = await this.notificationRepository.findByUserId(currentUser.userId);
    return notifications.map((notification) => notification.toJSON());
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
    const notification = await this.notificationRepository.markAsRead(currentUser.userId, notificationId);
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
    return notification.toJSON();
  }

  async createNotificationForCurrentUser(
    currentUser: AuthenticatedUser,
    dto: CreateNotificationDto,
  ): Promise<Record<string, any>> {
    await this.assertAuthenticated(currentUser);
    return this.createNotificationForUser(currentUser.userId, dto);
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
