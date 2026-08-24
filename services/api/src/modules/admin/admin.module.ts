import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { ExamsModule } from '../exams/exams.module';
import { HomeworkModule } from '../homework/homework.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Subject, SubjectSchema } from '../curriculum/schemas/subject.schema';
import { Chapter, ChapterSchema } from '../curriculum/schemas/chapter.schema';
import { Lesson, LessonSchema } from '../curriculum/schemas/lesson.schema';
import { ExamSession, ExamSessionSchema } from '../exams/schemas/exam-session.schema';
import {
  HomeworkSubmission,
  HomeworkSubmissionSchema,
} from '../homework/schemas/homework-submission.schema';
import {
  StudentSubscription,
  StudentSubscriptionSchema,
} from '../subscriptions/schemas/student-subscription.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../subscriptions/schemas/payment-transaction.schema';
import { AdminAuditLog, AdminAuditLogSchema } from './schemas/admin-audit-log.schema';
import { AdminAuditLogRepository } from './repositories/admin-audit-log.repository';
import { AdminAuditService } from './admin-audit.service';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    CurriculumModule,
    ExamsModule,
    HomeworkModule,
    SubscriptionsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: ExamSession.name, schema: ExamSessionSchema },
      { name: HomeworkSubmission.name, schema: HomeworkSubmissionSchema },
      { name: StudentSubscription.name, schema: StudentSubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: AdminAuditLog.name, schema: AdminAuditLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminAuditLogRepository, AdminAuditService, AdminService],
  exports: [AdminAuditService, AdminService],
})
export class AdminModule {}
