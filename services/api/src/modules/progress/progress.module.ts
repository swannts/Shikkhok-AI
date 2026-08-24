import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { LessonProgress, LessonProgressSchema } from './schemas/lesson-progress.schema';
import { LessonProgressRepository } from './repositories/lesson-progress.repository';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

@Module({
  imports: [
    UsersModule,
    CurriculumModule,
    MongooseModule.forFeature([{ name: LessonProgress.name, schema: LessonProgressSchema }]),
  ],
  controllers: [ProgressController],
  providers: [LessonProgressRepository, ProgressService],
  exports: [ProgressService, LessonProgressRepository],
})
export class ProgressModule {}
