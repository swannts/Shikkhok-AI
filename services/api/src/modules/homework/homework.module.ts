import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { HomeworkSubmission, HomeworkSubmissionSchema } from './schemas/homework-submission.schema';
import { HomeworkFeedback, HomeworkFeedbackSchema } from './schemas/homework-feedback.schema';
import { HomeworkSubmissionRepository } from './repositories/homework-submission.repository';
import { HomeworkFeedbackRepository } from './repositories/homework-feedback.repository';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';
import { HomeworkProcessor } from './homework-processor';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    CurriculumModule,
    BullModule.registerQueue({ name: 'homework' }),
    MongooseModule.forFeature([
      { name: HomeworkSubmission.name, schema: HomeworkSubmissionSchema },
      { name: HomeworkFeedback.name, schema: HomeworkFeedbackSchema },
    ]),
  ],
  controllers: [HomeworkController],
  providers: [
    HomeworkSubmissionRepository,
    HomeworkFeedbackRepository,
    HomeworkService,
    HomeworkProcessor,
  ],
  exports: [HomeworkService, HomeworkSubmissionRepository, HomeworkFeedbackRepository],
})
export class HomeworkModule {}
