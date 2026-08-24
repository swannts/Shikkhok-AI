import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MongoObjectIdPipe } from '../../common/pipes/mongo-object-id.pipe';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my notifications' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size, max 50' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Opaque pagination cursor' })
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
    @Param('notificationId', MongoObjectIdPipe) notificationId: string,
  ) {
    return this.notificationsService.markMyNotificationAsRead(user, notificationId);
  }

  @Post('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification for myself (admin only)' })
  @ApiResponse({ status: 403, description: 'Only admin accounts can use this endpoint' })
  async createForMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotificationForCurrentUser(user, dto);
  }

  @Post('admin/users/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification for a user' })
  async createForUser(
    @Param('userId', MongoObjectIdPipe) userId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.createNotificationForUser(userId, dto);
  }
}
