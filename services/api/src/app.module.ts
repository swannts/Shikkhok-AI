import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { validateConfig } from './core/config/env.validation';
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { QueueModule } from './core/queue/queue.module';
import { HealthModule } from './core/health/health.module';
import { AppLoggerService } from './core/logging/logging.service';
import { HTTPLoggerMiddleware } from './core/logging/logger.middleware';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { ProgressModule } from './modules/progress/progress.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ParentsModule } from './modules/parents/parents.module';
import { StudyPlanModule } from './modules/study-plan/study-plan.module';
import { TutorModule } from './modules/tutor/tutor.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SyncModule } from './modules/sync/sync.module';
import { ExamsModule } from './modules/exams/exams.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { TextbooksModule } from './modules/textbooks/textbooks.module';
import { SearchModule } from './modules/search/search.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateConfig,
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    HealthModule,
    UsersModule,
    AuthModule,
    StudentsModule,
    CurriculumModule,
    ProgressModule,
    PracticeModule,
    ParentsModule,
    StudyPlanModule,
    TutorModule,
    NotificationsModule,
    SyncModule,
    ExamsModule,
    HomeworkModule,
    TextbooksModule,
    SearchModule,
    GamificationModule,
    ClassroomsModule,
  ],
  providers: [AppLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HTTPLoggerMiddleware).forRoutes('*');
  }
}
