import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlanModule } from '../study-plan/study-plan.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SyncEvent, SyncEventSchema } from './schemas/sync-event.schema';
import {
  SyncDeviceCheckpoint,
  SyncDeviceCheckpointSchema,
} from './schemas/sync-device-checkpoint.schema';
import { SyncEventRepository } from './repositories/sync-event.repository';
import { SyncDeviceCheckpointRepository } from './repositories/sync-device-checkpoint.repository';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [
    UsersModule,
    ProgressModule,
    StudyPlanModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: SyncEvent.name, schema: SyncEventSchema },
      { name: SyncDeviceCheckpoint.name, schema: SyncDeviceCheckpointSchema },
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncEventRepository, SyncDeviceCheckpointRepository, SyncService],
})
export class SyncModule {}
