import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { ProgressModule } from '../progress/progress.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ParentProfile, ParentProfileSchema } from './schemas/parent-profile.schema';
import { ParentProfileRepository } from './repositories/parent-profile.repository';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    ProgressModule,
    GamificationModule,
    MongooseModule.forFeature([{ name: ParentProfile.name, schema: ParentProfileSchema }]),
  ],
  controllers: [ParentsController],
  providers: [ParentProfileRepository, ParentsService],
  exports: [ParentsService, ParentProfileRepository],
})
export class ParentsModule {}
