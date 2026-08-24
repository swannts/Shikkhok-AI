import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { PracticeModule } from '../practice/practice.module';
import { Exam, ExamSchema } from './schemas/exam.schema';
import { ExamSession, ExamSessionSchema } from './schemas/exam-session.schema';
import { ExamAnswer, ExamAnswerSchema } from './schemas/exam-answer.schema';
import { ExamRepository } from './repositories/exam.repository';
import { ExamSessionRepository } from './repositories/exam-session.repository';
import { ExamAnswerRepository } from './repositories/exam-answer.repository';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    PracticeModule,
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: ExamSession.name, schema: ExamSessionSchema },
      { name: ExamAnswer.name, schema: ExamAnswerSchema },
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamRepository, ExamSessionRepository, ExamAnswerRepository, ExamsService],
  exports: [ExamsService, ExamRepository, ExamSessionRepository, ExamAnswerRepository],
})
export class ExamsModule {}
