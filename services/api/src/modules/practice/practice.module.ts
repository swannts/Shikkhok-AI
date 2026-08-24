import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ProgressModule } from '../progress/progress.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { PracticeQuestion, PracticeQuestionSchema } from './schemas/practice-question.schema';
import { PracticeAttempt, PracticeAttemptSchema } from './schemas/practice-attempt.schema';
import { PracticeQuestionRepository } from './repositories/practice-question.repository';
import { PracticeAttemptRepository } from './repositories/practice-attempt.repository';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';

@Module({
  imports: [
    UsersModule,
    ProgressModule,
    CurriculumModule,
    MongooseModule.forFeature([
      { name: PracticeQuestion.name, schema: PracticeQuestionSchema },
      { name: PracticeAttempt.name, schema: PracticeAttemptSchema },
    ]),
  ],
  controllers: [PracticeController],
  providers: [PracticeQuestionRepository, PracticeAttemptRepository, PracticeService],
})
export class PracticeModule {}
