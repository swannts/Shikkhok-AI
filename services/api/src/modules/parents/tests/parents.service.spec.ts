import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParentsService } from '../parents.service';
import { ParentProfileRepository } from '../repositories/parent-profile.repository';
import { UsersService } from '../../users/users.service';
import { StudentsService } from '../../students/students.service';
import { ProgressService } from '../../progress/progress.service';
import { GamificationService } from '../../gamification/gamification.service';
import { UserRole } from '../../users/enums/user-role.enum';

describe('ParentsService', () => {
  let service: ParentsService;
  let parentProfileRepository: jest.Mocked<ParentProfileRepository>;
  let usersService: jest.Mocked<UsersService>;
  let studentsService: jest.Mocked<StudentsService>;
  let progressService: jest.Mocked<ProgressService>;
  let gamificationService: jest.Mocked<GamificationService>;

  const parentUserId = new Types.ObjectId().toString();
  const childUserId = new Types.ObjectId().toString();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentsService,
        {
          provide: ParentProfileRepository,
          useValue: {
            findByUserId: jest.fn(),
            upsertProfile: jest.fn(),
            addLinkedStudent: jest.fn(),
            removeLinkedStudent: jest.fn(),
            updateAlertSettings: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByEmailOrPhone: jest.fn(),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getSummaryForUserId: jest.fn(),
          },
        },
        {
          provide: GamificationService,
          useValue: {
            getMySummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ParentsService);
    parentProfileRepository = module.get(ParentProfileRepository);
    usersService = module.get(UsersService);
    studentsService = module.get(StudentsService);
    progressService = module.get(ProgressService);
    gamificationService = module.get(GamificationService);
  });

  it('should return parent profile', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ displayName: 'Parent' }),
    } as any);

    await expect(
      service.getMyProfile({ userId: parentUserId, role: UserRole.PARENT }),
    ).resolves.toEqual({ displayName: 'Parent' });
  });

  it('should reject non-parent accounts', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);

    await expect(
      service.getMyProfile({ userId: parentUserId, role: UserRole.STUDENT }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should link a child by email or phone lookup', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    usersService.findByEmailOrPhone.mockResolvedValue({
      _id: new Types.ObjectId(),
      role: UserRole.STUDENT,
    } as any);
    parentProfileRepository.addLinkedStudent.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ linkedStudentIds: [childUserId] }),
    } as any);

    const result = await service.linkChild(
      { userId: parentUserId, role: UserRole.PARENT },
      { studentIdentifier: '01712345678' },
    );

    expect(result).toEqual({ linkedStudentIds: [childUserId] });
  });

  it('should reject unlinked child dashboard access', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      linkedStudentIds: [],
    } as any);

    await expect(
      service.getChildDashboard({ userId: parentUserId, role: UserRole.PARENT }, childUserId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should build child detailed learning analytics', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      linkedStudentIds: [new Types.ObjectId(childUserId)],
    } as any);
    studentsService.getProfileByUserId.mockResolvedValue({ name: 'Child', classLevel: 8 } as any);
    progressService.getSummaryForUserId.mockResolvedValue({
      totalLessons: 10,
      completedLessonsCount: 8,
    } as any);
    gamificationService.getMySummary.mockResolvedValue({
      points: 350,
      tier: 'silver',
      streak: { currentStreak: 4 },
    } as any);

    const analytics = await service.getChildAnalytics(
      { userId: parentUserId, role: UserRole.PARENT },
      childUserId,
    );

    expect(analytics.progressSummary.completedLessonsCount).toBe(8);
    expect(analytics.gamificationSummary.tier).toBe('silver');
  });

  it('should generate automated weekly report with AI Bangla insights', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      linkedStudentIds: [new Types.ObjectId(childUserId)],
    } as any);
    studentsService.getProfileByUserId.mockResolvedValue({ name: 'Rahim', classLevel: 8 } as any);
    progressService.getSummaryForUserId.mockResolvedValue({ completedLessonsCount: 5 } as any);
    gamificationService.getMySummary.mockResolvedValue({
      points: 250,
      streak: { currentStreak: 5 },
    } as any);

    const report = await service.getChildWeeklyReport(
      { userId: parentUserId, role: UserRole.PARENT },
      childUserId,
      { days: 7 },
    );

    expect(report.studentName).toBe('Rahim');
    expect(report.currentStreakDays).toBe(5);
    expect(report.aiParentInsightsBn).toContain('চমৎকার ধারাবাহিকতা');
    expect(report.recommendationsBn).toHaveLength(2);
  });

  it('should update parent alert settings', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.updateAlertSettings.mockResolvedValue({
      toJSON: () => ({
        alertSettings: {
          lowExamScoreAlert: true,
          lowExamScoreThreshold: 60,
          brokenStreakAlert: true,
        },
      }),
    } as any);

    const result = await service.updateAlertSettings(
      { userId: parentUserId, role: UserRole.PARENT },
      { lowExamScoreThreshold: 60 },
    );

    expect(result.alertSettings.lowExamScoreThreshold).toBe(60);
  });
});
