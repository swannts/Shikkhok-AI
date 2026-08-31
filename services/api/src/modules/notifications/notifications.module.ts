import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '../users/users.module';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { DeviceToken, DeviceTokenSchema } from './schemas/device-token.schema';
import { NotificationRepository } from './repositories/notification.repository';
import { DeviceTokenRepository } from './repositories/device-token.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FcmPushProvider } from './providers/fcm-push.provider';

@Module({
  imports: [
    UsersModule,
    BullModule.registerQueue({ name: 'notifications' }),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationRepository,
    DeviceTokenRepository,
    NotificationsService,
    FcmPushProvider,
  ],
  exports: [
    NotificationsService,
    NotificationRepository,
    DeviceTokenRepository,
    FcmPushProvider,
  ],
})
export class NotificationsModule {}
