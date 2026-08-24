import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my notifications' })
  async getMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.notificationsService.getMyNotifications(user, limit ? Number(limit) : 20, cursor);
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getMyUnreadCount(user);
  }

  @Post('me/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllMyNotificationsAsRead(user);
  }

  @Post('me/:notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markMyNotificationAsRead(user, notificationId);
  }

  @Post('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification for myself' })
  async createForMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.createNotificationForCurrentUser(user, dto);
  }

  @Post('admin/users/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification for a user' })
  async createForUser(
    @Param('userId') userId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.createNotificationForUser(userId, dto);
  }
}
