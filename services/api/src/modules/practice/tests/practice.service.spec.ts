import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PracticeService } from '../practice.service';
import { PracticeQuestionRepository } from '../repositories/practice-question.repository';
import { PracticeAttemptRepository } from '../repositories/practice-attempt.repository';
import { ProgressService } from '../../progress/progress.service';
import { LessonRepository } from '../../curriculum/repositories/lesson.repository';
import { ChapterRepository } from '../../curriculum/repositories/chapter.repository';
import { SubjectRepository } from '../../curriculum/repositories/subject.repository';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { PracticeQuestionType } from '../enums/practice-question-type.enum';
import { MasteryEngineV1 } from '../domain/mastery-engine-v1';
import { ProgressStatus } from '../../progress/enums/progress-status.enum';

describe('PracticeService', () => {
  let service: PracticeService;
  let questionRepository: jest.Mocked<PracticeQuestionRepository>;
  let attemptRepository: jest.Mocked<PracticeAttemptRepository>;
  let progressService: jest.Mocked<ProgressService>;
  let lessonRepository: jest.Mocked<LessonRepository>;
  let chapterRepository: jest.Mocked<ChapterRepository>;
  let subjectRepository: jest.Mocked<SubjectRepository>;
  let usersService: jest.Mocked<UsersService>;
  let masteryEngine: jest.Mocked<MasteryEngineV1>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PracticeQuestionRepository,
          useValue: {
            findById: jest.fn(),
            findPublishedByLesson: jest.fn(),
          },
        },
        {
          provide: PracticeAttemptRepository,
          useValue: {
            createAttempt: jest.fn(),
            findRecentByUserId: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getMyLessonProgress: jest.fn(),
            upsertMyLessonProgress: jest.fn(),
            getMySummary: jest.fn(),
            getMySubjectProgress: jest.fn(),
          },
        },
        {
          provide: LessonRepository,
          useValue: { findById: jest.fn(), findPublishedByChapterId: jest.fn() },
        },
        {
          provide: ChapterRepository,
          useValue: { findById: jest.fn(), findPublishedBySubjectId: jest.fn() },
        },
        {
          provide: SubjectRepository,
          useValue: { findById: jest.fn(), findPublishedByFilter: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn(), findByEmailOrPhone: jest.fn() },
        },
        {
          provide: MasteryEngineV1,
          useValue: {
            calculate: jest.fn().mockReturnValue({
              newMastery: 78,
              delta: 8,
              algorithmVersion: 1,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PracticeService);
    questionRepository = module.get(PracticeQuestionRepository);
    attemptRepository = module.get(PracticeAttemptRepository);
    progressService = module.get(ProgressService);
    lessonRepository = module.get(LessonRepository);
    chapterRepository = module.get(ChapterRepository);
    subjectRepository = module.get(SubjectRepository);
    usersService = module.get(UsersService);
    masteryEngine = module.get(MasteryEngineV1);
  });

  it('should evaluate mcq attempts and update progress', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    questionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      isPublished: true,
      questionType: PracticeQuestionType.MCQ,
      correctOptionIds: ['opt-a'],
      lessonId: new Types.ObjectId('64b8268b6cb348e3b53f3141'),
      chapterId: new Types.ObjectId('64b8268b6cb348e3b53f3142'),
      subjectId: new Types.ObjectId('64b8268b6cb348e3b53f3143'),
      toJSON: jest.fn(),
    } as any);
    lessonRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId('64b8268b6cb348e3b53f3141'),
      chapterId: new Types.ObjectId('64b8268b6cb348e3b53f3142'),
    } as any);
    chapterRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId('64b8268b6cb348e3b53f3142'),
      subjectId: new Types.ObjectId('64b8268b6cb348e3b53f3143'),
      title: 'Chapter',
    } as any);
    subjectRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId('64b8268b6cb348e3b53f3143'),
    } as any);
    attemptRepository.createAttempt.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ isCorrect: true }),
    } as any);
    progressService.getMyLessonProgress.mockRejectedValue(new NotFoundException());
    progressService.upsertMyLessonProgress.mockResolvedValue({ masteryScore: 100 } as any);

    const result = await service.submitAttempt(
      { userId: '64b8268b6cb348e3b53f3140', role: UserRole.STUDENT },
      {
        questionId: '64b8268b6cb348e3b53f3150',
        questionType: PracticeQuestionType.MCQ,
        selectedOptionId: 'opt-a',
      },
    );

    expect(result.isCorrect).toBe(true);
    expect(progressService.upsertMyLessonProgress).toHaveBeenCalled();
    expect(masteryEngine.calculate).toHaveBeenCalled();
    expect(progressService.upsertMyLessonProgress.mock.calls[0][2].status).not.toBe(ProgressStatus.COMPLETED);
  });

  it('should reject mismatched student ids', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    questionRepository.findById.mockResolvedValue({
      isPublished: true,
      questionType: PracticeQuestionType.MCQ,
      correctOptionIds: ['opt-a'],
      lessonId: new Types.ObjectId('64b8268b6cb348e3b53f3141'),
      chapterId: new Types.ObjectId('64b8268b6cb348e3b53f3142'),
      subjectId: new Types.ObjectId('64b8268b6cb348e3b53f3143'),
    } as any);

    await expect(
      service.submitAttempt(
        { userId: '64b8268b6cb348e3b53f3140', role: UserRole.STUDENT },
        {
          studentId: 'someone-else',
          questionId: '64b8268b6cb348e3b53f3150',
          questionType: PracticeQuestionType.MCQ,
          selectedOptionId: 'opt-a',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject unsupported question types when question metadata mismatches', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    questionRepository.findById.mockResolvedValue({
      isPublished: true,
      questionType: PracticeQuestionType.TRUE_FALSE,
    } as any);

    await expect(
      service.submitAttempt(
        { userId: '64b8268b6cb348e3b53f3140', role: UserRole.STUDENT },
        {
          questionId: '64b8268b6cb348e3b53f3150',
          questionType: PracticeQuestionType.MCQ,
          selectedOptionId: 'opt-a',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should not leak answer keys in student question listings', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    questionRepository.findPublishedByLesson.mockResolvedValue([
      {
        _id: new Types.ObjectId('64b8268b6cb348e3b53f4100'),
        subjectId: new Types.ObjectId('64b8268b6cb348e3b53f4101'),
        chapterId: new Types.ObjectId('64b8268b6cb348e3b53f4102'),
        lessonId: new Types.ObjectId('64b8268b6cb348e3b53f4103'),
        questionType: PracticeQuestionType.MCQ,
        prompt: 'Question',
        difficulty: 'medium',
        options: ['A', 'B'],
        tags: ['tag'],
        correctOptionIds: ['A'],
        acceptedAnswers: ['A'],
        answerConfig: { expectedValue: 1 },
        toJSON: jest.fn(),
      } as any,
    ]);

    const questions = await service.listQuestions(
      { userId: '64b8268b6cb348e3b53f3140', role: UserRole.STUDENT },
      '64b8268b6cb348e3b53f3131',
      10,
    );

    expect(questions[0]).not.toHaveProperty('correctOptionIds');
    expect(questions[0]).not.toHaveProperty('acceptedAnswers');
    expect(questions[0]).not.toHaveProperty('answerConfig');
    expect(questions[0]).toMatchObject({
      id: '64b8268b6cb348e3b53f4100',
      prompt: 'Question',
    });
  });
});
