import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { AchievementRepository } from './repositories/achievement.repository';
import { StudentAchievementRepository } from './repositories/student-achievement.repository';
import { StudentStreakRepository } from './repositories/student-streak.repository';
import { AchievementCategory } from './enums/achievement-category.enum';
import { StudentTier } from './enums/student-tier.enum';
import { RecordActivityDto } from './dto/record-activity.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@Injectable()
export class GamificationService implements OnModuleInit {
  constructor(
    private readonly achievementRepository: AchievementRepository,
    private readonly studentAchievementRepository: StudentAchievementRepository,
    private readonly studentStreakRepository: StudentStreakRepository,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultAchievements();
  }

  async getMySummary(currentUser: AuthenticatedUser): Promise<Record<string, any>> {
    const streak = await this.studentStreakRepository.findOrCreate(currentUser.userId);
    const unlocked = await this.studentAchievementRepository.findByStudentId(currentUser.userId);
    const tier = this.calculateTier(streak.totalPoints);

    return {
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
        freezeDaysRemaining: streak.freezeDaysRemaining,
        totalActiveDays: streak.totalActiveDays,
      },
      points: streak.totalPoints,
      tier,
      totalAchievementsUnlocked: unlocked.length,
      recentAchievements: unlocked.slice(0, 5).map((a) => a.toJSON()),
    };
  }

  async getMyAchievements(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    const [allAchievements, unlocked] = await Promise.all([
      this.achievementRepository.findAllPublished(),
      this.studentAchievementRepository.findByStudentId(currentUser.userId),
    ]);

    const unlockedMap = new Map<string, any>();
    for (const u of unlocked) {
      unlockedMap.set(u.achievementCode, u.toJSON());
    }

    return allAchievements.map((ach) => {
      const u = unlockedMap.get(ach.code);
      return {
        ...ach.toJSON(),
        isUnlocked: !!u,
        unlockedAt: u?.unlockedAt ?? null,
        progress: u?.progress ?? 0,
      };
    });
  }

  async recordActivity(
    currentUser: AuthenticatedUser,
    dto: RecordActivityDto,
  ): Promise<Record<string, any>> {
    const studentId = currentUser.userId;
    const targetDate = dto.date ?? new Date().toISOString().slice(0, 10);

    const streak = await this.studentStreakRepository.findOrCreate(studentId);
    let currentStreak = streak.currentStreak;
    let longestStreak = streak.longestStreak;
    let freezeDaysRemaining = streak.freezeDaysRemaining;
    let totalActiveDays = streak.totalActiveDays;
    let pointsAwarded = 0;
    const unlockedAchievements: string[] = [];

    if (streak.lastActiveDate === targetDate) {
      // Already recorded activity today
      return {
        streak: {
          currentStreak,
          longestStreak,
          lastActiveDate: targetDate,
          freezeDaysRemaining,
          totalActiveDays,
        },
        pointsAwarded: 0,
        unlockedAchievements: [],
        message: 'Activity already recorded for today',
      };
    }

    const lastDate = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
    const currentDate = new Date(targetDate);

    if (!lastDate) {
      // First active day ever
      currentStreak = 1;
      longestStreak = 1;
      totalActiveDays = 1;
      pointsAwarded = 10;
    } else {
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive active day!
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        totalActiveDays += 1;
        pointsAwarded = 10 + Math.min(currentStreak, 20); // Streak bonus
      } else if (diffDays === 2 && freezeDaysRemaining > 0) {
        // Missed 1 day, streak freeze protected!
        freezeDaysRemaining -= 1;
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        totalActiveDays += 1;
        pointsAwarded = 10;
      } else {
        // Streak broken
        currentStreak = 1;
        totalActiveDays += 1;
        pointsAwarded = 10;
      }
    }

    await this.studentStreakRepository.updateStreak(studentId, {
      currentStreak,
      longestStreak,
      lastActiveDate: targetDate,
      freezeDaysRemaining,
      totalActiveDays,
    });

    if (pointsAwarded > 0) {
      await this.studentStreakRepository.addPoints(studentId, pointsAwarded);
    }

    // Check streak milestones
    if (currentStreak >= 3) {
      const ach = await this.unlockAchievement(studentId, 'STREAK_3_DAYS');
      if (ach) unlockedAchievements.push('STREAK_3_DAYS');
    }
    if (currentStreak >= 7) {
      const ach = await this.unlockAchievement(studentId, 'STREAK_7_DAYS');
      if (ach) unlockedAchievements.push('STREAK_7_DAYS');
    }
    if (currentStreak >= 30) {
      const ach = await this.unlockAchievement(studentId, 'STREAK_30_DAYS');
      if (ach) unlockedAchievements.push('STREAK_30_DAYS');
    }

    return {
      streak: {
        currentStreak,
        longestStreak,
        lastActiveDate: targetDate,
        freezeDaysRemaining,
        totalActiveDays,
      },
      pointsAwarded,
      unlockedAchievements,
    };
  }

  async awardPoints(studentId: string, points: number): Promise<void> {
    await this.studentStreakRepository.addPoints(studentId, points);
  }

  async unlockAchievement(
    studentId: string,
    achievementCode: string,
    progress = 1,
  ): Promise<boolean> {
    const existing = await this.studentAchievementRepository.findByStudentAndCode(
      studentId,
      achievementCode,
    );
    if (existing) {
      return false;
    }

    const definition = await this.achievementRepository.findByCode(achievementCode);
    if (!definition) {
      return false;
    }

    await this.studentAchievementRepository.unlock({
      studentId,
      achievementId: definition._id.toString(),
      achievementCode: definition.code,
      pointsAwarded: definition.points,
      progress,
    });

    await this.studentStreakRepository.addPoints(studentId, definition.points);
    return true;
  }

  async getLeaderboard(
    currentUser: AuthenticatedUser,
    query: LeaderboardQueryDto,
  ): Promise<Record<string, any>[]> {
    const limit = Math.max(1, Math.min(query.limit ?? 20, 100));
    const streaks = await this.studentStreakRepository.getLeaderboard(limit);

    const results = [];
    let rank = 1;

    for (const streak of streaks) {
      const user = await this.usersService.findById(streak.studentId.toString()).catch(() => null);
      results.push({
        rank: rank++,
        studentId: streak.studentId.toString(),
        name: user?.name ? `${user.name.slice(0, 3)}***` : 'শিক্ষার্থী',
        totalPoints: streak.totalPoints,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        tier: this.calculateTier(streak.totalPoints),
        isMe: streak.studentId.toString() === currentUser.userId,
      });
    }

    return results;
  }

  private calculateTier(points: number): StudentTier {
    if (points >= 2500) return StudentTier.DIAMOND;
    if (points >= 1000) return StudentTier.PLATINUM;
    if (points >= 500) return StudentTier.GOLD;
    if (points >= 200) return StudentTier.SILVER;
    return StudentTier.BRONZE;
  }

  private async seedDefaultAchievements(): Promise<void> {
    const defaults = [
      {
        code: 'FIRST_LESSON',
        title: 'First Step',
        titleBn: 'প্রথম পদক্ষেপ',
        description: 'Completed your first NCTB lesson',
        descriptionBn: 'প্রথম এনসিটিবি পাঠ সম্পন্ন করেছো',
        iconUrl: 'https://cdn.shikkhok.ai/badges/first-step.png',
        category: AchievementCategory.CURRICULUM,
        points: 50,
        targetValue: 1,
      },
      {
        code: 'STREAK_3_DAYS',
        title: '3-Day Streak',
        titleBn: '৩ দিনের ধারাবাহিকতা',
        description: 'Studied for 3 consecutive days',
        descriptionBn: 'টানা ৩ দিন পড়াশোনা সম্পন্ন করেছো',
        iconUrl: 'https://cdn.shikkhok.ai/badges/streak-3.png',
        category: AchievementCategory.STREAK,
        points: 75,
        targetValue: 3,
      },
      {
        code: 'STREAK_7_DAYS',
        title: 'Week Champion',
        titleBn: 'সাপ্তাহিক চ্যাম্পিয়ন',
        description: 'Maintained a 7-day study streak',
        descriptionBn: 'টানা ৭ দিনের স্ট্রিক বজায় রেখেছো',
        iconUrl: 'https://cdn.shikkhok.ai/badges/streak-7.png',
        category: AchievementCategory.STREAK,
        points: 150,
        targetValue: 7,
      },
      {
        code: 'STREAK_30_DAYS',
        title: 'Monthly Legend',
        titleBn: 'মাসের সেরা শিক্ষার্থী',
        description: 'Studied for 30 consecutive days',
        descriptionBn: 'টানা ৩০ দিনের অসাধারণ স্ট্রিক অর্জন',
        iconUrl: 'https://cdn.shikkhok.ai/badges/streak-30.png',
        category: AchievementCategory.STREAK,
        points: 500,
        targetValue: 30,
      },
      {
        code: 'PRACTICE_HERO',
        title: 'Practice Hero',
        titleBn: 'অনুশীলন বীর',
        description: 'Completed 50 adaptive practice questions',
        descriptionBn: '৫০টি এডাপ্টিভ অনুশীলন সমাধান করেছো',
        iconUrl: 'https://cdn.shikkhok.ai/badges/practice-hero.png',
        category: AchievementCategory.PRACTICE,
        points: 200,
        targetValue: 50,
      },
      {
        code: 'EXAM_ACE',
        title: 'Exam Ace',
        titleBn: 'পরীক্ষা বিজয়ী',
        description: 'Passed a timed exam with over 80% score',
        descriptionBn: '৮০% এর বেশি নম্বর পেয়ে পরীক্ষা উত্তীর্ণ',
        iconUrl: 'https://cdn.shikkhok.ai/badges/exam-ace.png',
        category: AchievementCategory.EXAM,
        points: 250,
        targetValue: 1,
      },
    ];

    for (const item of defaults) {
      const exists = await this.achievementRepository.findByCode(item.code);
      if (!exists) {
        await this.achievementRepository.createAchievement({ ...item, isPublished: true });
      }
    }
  }
}
