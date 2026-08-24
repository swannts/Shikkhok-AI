import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProgressService } from '../progress.service';
import { LessonProgressRepository } from '../repositories/lesson-progress.repository';
import { UsersService } from '../../users/users.service';
import { LessonRepository } from '../../curriculum/repositories/lesson.repository';
import { ChapterRepository } from '../../curriculum/repositories/chapter.repository';
import { SubjectRepository } from '../../curriculum/repositories/subject.repository';
import { UserRole } from '../../users/enums/user-role.enum';
import { ProgressStatus } from '../enums/progress-status.enum';

describe('ProgressService', () => {
  let service: ProgressService;
  let lessonProgressRepository: jest.Mocked<LessonProgressRepository>;
  let usersService: jest.Mocked<UsersService>;
  let lessonRepository: jest.Mocked<LessonRepository>;
  let chapterRepository: jest.Mocked<ChapterRepository>;
  let subjectRepository: jest.Mocked<SubjectRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: LessonProgressRepository,
          useValue: {
            upsertByLessonId: jest.fn(),
            findByLessonId: jest.fn(),
            findByUserId: jest.fn(),
            findByUserAndSubject: jest.fn(),
            countCompletedByChapter: jest.fn(),
          },
        },
        {
          provide: LessonRepository,
          useValue: {
            findById: jest.fn(),
            findPublishedByChapterId: jest.fn(),
          },
        },
        {
          provide: ChapterRepository,
          useValue: {
            findById: jest.fn(),
            findPublishedBySubjectId: jest.fn(),
          },
        },
        {
          provide: SubjectRepository,
          useValue: {
            findById: jest.fn(),
            findPublishedByFilter: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByEmailOrPhone: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProgressService);
    lessonProgressRepository = module.get(LessonProgressRepository);
    usersService = module.get(UsersService);
    lessonRepository = module.get(LessonRepository);
    chapterRepository = module.get(ChapterRepository);
    subjectRepository = module.get(SubjectRepository);
  });

  it('should upsert lesson progress for a student', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    lessonRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId('64b8268b6cb348e3b53f3122'),
      chapterId: new Types.ObjectId('64b8268b6cb348e3b53f3123'),
    } as any);
    chapterRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId('64b8268b6cb348e3b53f3123'),
      subjectId: new Types.ObjectId('64b8268b6cb348e3b53f3124'),
    } as any);
    subjectRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId('64b8268b6cb348e3b53f3124'),
    } as any);
    lessonProgressRepository.upsertByLessonId.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ status: ProgressStatus.COMPLETED }),
    } as any);

    const result = await service.upsertMyLessonProgress(
      { userId: '64b8268b6cb348e3b53f3121', role: UserRole.STUDENT },
      '64b8268b6cb348e3b53f3122',
      { status: ProgressStatus.COMPLETED, progressPercent: 100, masteryScore: 95 },
    );

    expect(result).toEqual({ status: ProgressStatus.COMPLETED });
  });

  it('should reject non-student accounts', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);

    await expect(
      service.getMySummary({ userId: 'user-1', role: UserRole.PARENT }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw when lesson is missing', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    lessonRepository.findById.mockResolvedValue(null);

    await expect(
      service.upsertMyLessonProgress(
        { userId: 'user-1', role: UserRole.STUDENT },
        'missing',
        {},
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should build a summary from lesson progress records', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    lessonProgressRepository.findByUserId.mockResolvedValue([
      {
        status: ProgressStatus.COMPLETED,
        timeSpentMinutes: 15,
        masteryScore: 90,
        subjectId: new Types.ObjectId('64b8268b6cb348e3b53f3124'),
        chapterId: new Types.ObjectId('64b8268b6cb348e3b53f3123'),
      },
      {
        status: ProgressStatus.IN_PROGRESS,
        timeSpentMinutes: 20,
        masteryScore: 60,
        subjectId: new Types.ObjectId('64b8268b6cb348e3b53f3124'),
        chapterId: new Types.ObjectId('64b8268b6cb348e3b53f3123'),
      },
    ] as any);

    const summary = await service.getMySummary({
      userId: '64b8268b6cb348e3b53f3121',
      role: UserRole.STUDENT,
    });

    expect(summary.totalLessons).toBe(2);
    expect(summary.completedLessons).toBe(1);
    expect(summary.completionRate).toBe(50);
    expect(summary.averageMastery).toBe(75);
  });
});
