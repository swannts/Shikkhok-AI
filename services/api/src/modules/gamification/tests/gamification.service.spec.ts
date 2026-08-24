import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { GamificationService } from '../gamification.service';
import { AchievementRepository } from '../repositories/achievement.repository';
import { StudentAchievementRepository } from '../repositories/student-achievement.repository';
import { StudentStreakRepository } from '../repositories/student-streak.repository';
import { UsersService } from '../../users/users.service';
import { StudentsService } from '../../students/students.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { StudentTier } from '../enums/student-tier.enum';

describe('GamificationService', () => {
  let service: GamificationService;
  let achievementRepository: jest.Mocked<AchievementRepository>;
  let studentAchievementRepository: jest.Mocked<StudentAchievementRepository>;
  let studentStreakRepository: jest.Mocked<StudentStreakRepository>;
  let usersService: jest.Mocked<UsersService>;

  const studentUserId = new Types.ObjectId().toString();
  const studentUser = { userId: studentUserId, role: UserRole.STUDENT };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: AchievementRepository,
          useValue: {
            createAchievement: jest.fn(),
            findAllPublished: jest.fn().mockResolvedValue([]),
            findByCode: jest.fn(),
          },
        },
        {
          provide: StudentAchievementRepository,
          useValue: {
            unlock: jest.fn(),
            findByStudentId: jest.fn().mockResolvedValue([]),
            findByStudentAndCode: jest.fn(),
          },
        },
        {
          provide: StudentStreakRepository,
          useValue: {
            findOrCreate: jest.fn(),
            updateStreak: jest.fn(),
            addPoints: jest.fn(),
            getLeaderboard: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(GamificationService);
    achievementRepository = module.get(AchievementRepository);
    studentAchievementRepository = module.get(StudentAchievementRepository);
    studentStreakRepository = module.get(StudentStreakRepository);
    usersService = module.get(UsersService);
  });

  it('should return summary with streak, points, and tier', async () => {
    studentStreakRepository.findOrCreate.mockResolvedValue({
      studentId: new Types.ObjectId(studentUserId),
      currentStreak: 5,
      longestStreak: 10,
      lastActiveDate: '2026-08-24',
      freezeDaysRemaining: 1,
      totalActiveDays: 15,
      totalPoints: 600,
    } as any);

    studentAchievementRepository.findByStudentId.mockResolvedValue([
      {
        achievementCode: 'FIRST_LESSON',
        unlockedAt: new Date(),
        toJSON: () => ({ achievementCode: 'FIRST_LESSON' }),
      } as any,
    ]);

    const summary = await service.getMySummary(studentUser);
    expect(summary.points).toBe(600);
    expect(summary.tier).toBe(StudentTier.GOLD);
    expect(summary.streak.currentStreak).toBe(5);
    expect(summary.totalAchievementsUnlocked).toBe(1);
  });

  it('should increment streak on consecutive active days', async () => {
    studentStreakRepository.findOrCreate.mockResolvedValue({
      studentId: new Types.ObjectId(studentUserId),
      currentStreak: 2,
      longestStreak: 2,
      lastActiveDate: '2026-08-23',
      freezeDaysRemaining: 1,
      totalActiveDays: 2,
      totalPoints: 50,
    } as any);

    // Mock 3-day streak achievement
    achievementRepository.findByCode.mockResolvedValue({
      _id: new Types.ObjectId(),
      code: 'STREAK_3_DAYS',
      points: 75,
    } as any);
    studentAchievementRepository.findByStudentAndCode.mockResolvedValue(null);

    const result = await service.recordActivity(studentUser, { date: '2026-08-24' });

    expect(result.streak.currentStreak).toBe(3);
    expect(result.streak.longestStreak).toBe(3);
    expect(result.unlockedAchievements).toContain('STREAK_3_DAYS');
    expect(studentStreakRepository.updateStreak).toHaveBeenCalledWith(
      studentUserId,
      expect.objectContaining({
        currentStreak: 3,
        lastActiveDate: '2026-08-24',
      }),
    );
  });

  it('should consume streak freeze day when 1 day is missed', async () => {
    studentStreakRepository.findOrCreate.mockResolvedValue({
      studentId: new Types.ObjectId(studentUserId),
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDate: '2026-08-22', // Missed 2026-08-23
      freezeDaysRemaining: 1,
      totalActiveDays: 5,
      totalPoints: 100,
    } as any);

    const result = await service.recordActivity(studentUser, { date: '2026-08-24' });

    expect(result.streak.currentStreak).toBe(6);
    expect(result.streak.freezeDaysRemaining).toBe(0); // 1 freeze day consumed
    expect(studentStreakRepository.updateStreak).toHaveBeenCalledWith(
      studentUserId,
      expect.objectContaining({
        currentStreak: 6,
        freezeDaysRemaining: 0,
      }),
    );
  });

  it('should return leaderboard with student tier and masked names', async () => {
    studentStreakRepository.getLeaderboard.mockResolvedValue([
      {
        studentId: new Types.ObjectId(studentUserId),
        totalPoints: 1200,
        currentStreak: 7,
        longestStreak: 14,
      } as any,
    ]);

    usersService.findById.mockResolvedValue({
      name: 'Rahim Ahmed',
    } as any);

    const leaderboard = await service.getLeaderboard(studentUser, {});
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].name).toBe('Rah***');
    expect(leaderboard[0].tier).toBe(StudentTier.PLATINUM);
    expect(leaderboard[0].isMe).toBe(true);
  });
});
