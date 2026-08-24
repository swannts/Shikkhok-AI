import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlan, StudyPlanSchema } from './schemas/study-plan.schema';
import { StudyPlanRepository } from './repositories/study-plan.repository';
import { StudyPlanService } from './study-plan.service';
import { StudyPlanController } from './study-plan.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    ProgressModule,
    MongooseModule.forFeature([{ name: StudyPlan.name, schema: StudyPlanSchema }]),
  ],
  controllers: [StudyPlanController],
  providers: [StudyPlanRepository, StudyPlanService],
  exports: [StudyPlanService, StudyPlanRepository],
})
export class StudyPlanModule {}
