import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { StudentAchievement, StudentAchievementSchema } from './schemas/student-achievement.schema';
import { StudentStreak, StudentStreakSchema } from './schemas/student-streak.schema';
import { AchievementRepository } from './repositories/achievement.repository';
import { StudentAchievementRepository } from './repositories/student-achievement.repository';
import { StudentStreakRepository } from './repositories/student-streak.repository';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: StudentAchievement.name, schema: StudentAchievementSchema },
      { name: StudentStreak.name, schema: StudentStreakSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [
    AchievementRepository,
    StudentAchievementRepository,
    StudentStreakRepository,
    GamificationService,
  ],
  exports: [
    GamificationService,
    AchievementRepository,
    StudentAchievementRepository,
    StudentStreakRepository,
  ],
})
export class GamificationModule {}
