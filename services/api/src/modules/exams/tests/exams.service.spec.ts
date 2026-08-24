import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ExamsService } from '../exams.service';
import { ExamRepository } from '../repositories/exam.repository';
import { ExamSessionRepository } from '../repositories/exam-session.repository';
import { ExamAnswerRepository } from '../repositories/exam-answer.repository';
import { PracticeQuestionRepository } from '../../practice/repositories/practice-question.repository';
import { UsersService } from '../../users/users.service';
import { StudentsService } from '../../students/students.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { ExamStatus } from '../enums/exam-status.enum';
import { ExamSessionStatus } from '../enums/exam-session-status.enum';

describe('ExamsService', () => {
  let service: ExamsService;
  let examRepository: jest.Mocked<ExamRepository>;
  let sessionRepository: jest.Mocked<ExamSessionRepository>;
  let answerRepository: jest.Mocked<ExamAnswerRepository>;
  let questionRepository: jest.Mocked<PracticeQuestionRepository>;
  let usersService: jest.Mocked<UsersService>;
  let studentsService: jest.Mocked<StudentsService>;

  const studentUserId = new Types.ObjectId().toString();
  const studentUser = { userId: studentUserId, role: UserRole.STUDENT };

  const mockQuestionId1 = new Types.ObjectId();
  const mockQuestionId2 = new Types.ObjectId();

  const mockExam = {
    _id: new Types.ObjectId(),
    title: 'Science Term Final',
    titleBn: 'বিজ্ঞান চূড়ান্ত পরীক্ষা',
    subjectId: new Types.ObjectId(),
    classLevel: 8,
    medium: 'bangla',
    curriculumYear: 2026,
    questionIds: [mockQuestionId1, mockQuestionId2],
    timeLimitMinutes: 30,
    totalMarks: 50,
    passMarks: 20,
    instructions: 'All questions compulsory',
    status: ExamStatus.PUBLISHED,
    publishedAt: new Date(),
    toJSON: jest.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: ExamRepository,
          useValue: {
            createExam: jest.fn(),
            findById: jest.fn(),
            findPublished: jest.fn(),
          },
        },
        {
          provide: ExamSessionRepository,
          useValue: {
            createSession: jest.fn(),
            findById: jest.fn(),
            findActiveSession: jest.fn(),
            findByStudentId: jest.fn(),
            updateStatus: jest.fn(),
            submitSession: jest.fn(),
          },
        },
        {
          provide: ExamAnswerRepository,
          useValue: {
            saveAnswer: jest.fn(),
            setFlag: jest.fn(),
            findBySessionId: jest.fn(),
            gradeAnswer: jest.fn(),
          },
        },
        {
          provide: PracticeQuestionRepository,
          useValue: {
            findById: jest.fn(),
            findManyByIds: jest.fn(),
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

    service = module.get(ExamsService);
    examRepository = module.get(ExamRepository);
    sessionRepository = module.get(ExamSessionRepository);
    answerRepository = module.get(ExamAnswerRepository);
    questionRepository = module.get(PracticeQuestionRepository);
    usersService = module.get(UsersService);
    studentsService = module.get(StudentsService);
  });

  it('should list published exams for authenticated student', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    studentsService.getProfileByUserId.mockResolvedValue({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    } as any);
    examRepository.findPublished.mockResolvedValue([mockExam as any]);

    const result = await service.listExams(studentUser, {});
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Science Term Final');
    expect(examRepository.findPublished).toHaveBeenCalledWith({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
      subjectId: undefined,
    });
  });

  it('should start a new timed exam session and return sanitized questions', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    examRepository.findById.mockResolvedValue(mockExam as any);
    sessionRepository.findActiveSession.mockResolvedValue(null);

    const mockSession = {
      _id: new Types.ObjectId(),
      studentId: new Types.ObjectId(studentUserId),
      examId: mockExam._id,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60000),
      status: ExamSessionStatus.ACTIVE,
      toJSON: jest.fn().mockImplementation(function (this: any) {
        return { ...this };
      }),
    };
    sessionRepository.createSession.mockResolvedValue(mockSession as any);
    questionRepository.findManyByIds.mockResolvedValue([
      {
        _id: mockQuestionId1,
        prompt: 'What is photosynthesis?',
        options: ['A', 'B'],
        questionType: 'multiple_choice',
        correctOptionIds: ['0'],
      },
    ] as any);
    answerRepository.findBySessionId.mockResolvedValue([]);

    const result = await service.startSession(studentUser, mockExam._id.toString());
    expect(result.session).toBeDefined();
    expect(result.questions).toHaveLength(1);
    // Verified correctOptionIds is stripped from student session payload
    expect(result.questions[0].correctOptionIds).toBeUndefined();
    expect(result.questions[0].prompt).toBe('What is photosynthesis?');
  });

  it('should save answer for an active session and reject if expired', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const mockSession = {
      _id: new Types.ObjectId(),
      studentId: { toString: () => studentUserId },
      examId: mockExam._id,
      expiresAt: new Date(Date.now() - 5000), // Expired!
      status: ExamSessionStatus.ACTIVE,
    };
    sessionRepository.findById.mockResolvedValue(mockSession as any);

    await expect(
      service.saveAnswer(studentUser, mockSession._id.toString(), mockQuestionId1.toString(), {
        submittedAnswer: '0',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(sessionRepository.updateStatus).toHaveBeenCalledWith(
      mockSession._id.toString(),
      ExamSessionStatus.EXPIRED,
    );
  });

  it('should grade session accurately on submission and compute final percentage', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const mockSession = {
      _id: new Types.ObjectId(),
      studentId: { toString: () => studentUserId },
      examId: mockExam._id,
      status: ExamSessionStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 60000),
    };
    sessionRepository.findById.mockResolvedValue(mockSession as any);
    examRepository.findById.mockResolvedValue(mockExam as any);
    questionRepository.findManyByIds.mockResolvedValue([
      {
        _id: mockQuestionId1,
        correctOptionIds: ['option_0'],
        acceptedAnswers: ['light'],
      },
      {
        _id: mockQuestionId2,
        correctOptionIds: ['option_1'],
        acceptedAnswers: ['water'],
      },
    ] as any);
    answerRepository.findBySessionId.mockResolvedValue([
      {
        questionId: mockQuestionId1,
        submittedAnswer: 'option_0', // Correct
      },
      {
        questionId: mockQuestionId2,
        submittedAnswer: 'wrong_ans', // Wrong
      },
    ] as any);
    sessionRepository.submitSession.mockResolvedValue({
      _id: mockSession._id,
      status: ExamSessionStatus.SUBMITTED,
      score: 25,
      percentage: 50,
      submittedAt: new Date(),
    } as any);

    const result = await service.submitSession(studentUser, mockSession._id.toString());

    expect(result.status).toBe(ExamSessionStatus.SUBMITTED);
    expect(result.score).toBe(25); // 1 correct out of 2 = 25 / 50 marks
    expect(result.percentage).toBe(50);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(1);
    expect(result.passed).toBe(true); // passMarks = 20
  });

  it('should provide full review with correct answers only after submission', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const mockSession = {
      _id: new Types.ObjectId(),
      studentId: { toString: () => studentUserId },
      examId: mockExam._id,
      status: ExamSessionStatus.SUBMITTED,
      score: 25,
      percentage: 50,
      toJSON: jest.fn().mockReturnValue({ status: ExamSessionStatus.SUBMITTED }),
    };
    sessionRepository.findById.mockResolvedValue(mockSession as any);
    examRepository.findById.mockResolvedValue(mockExam as any);
    questionRepository.findManyByIds.mockResolvedValue([
      {
        _id: mockQuestionId1,
        prompt: 'Q1',
        options: ['A', 'B'],
        correctOptionIds: ['0'],
        acceptedAnswers: ['A'],
      },
    ] as any);
    answerRepository.findBySessionId.mockResolvedValue([
      {
        questionId: mockQuestionId1,
        submittedAnswer: '0',
        isCorrect: true,
        marksAwarded: 25,
        flagged: false,
        toJSON: jest.fn().mockReturnValue({
          submittedAnswer: '0',
          isCorrect: true,
          marksAwarded: 25,
          flagged: false,
        }),
      },
    ] as any);

    const review = await service.getSessionReview(studentUser, mockSession._id.toString());
    expect(review.questions).toHaveLength(1);
    expect(review.questions[0].correctOptionIds).toEqual(['0']);
    expect(review.questions[0].isCorrect).toBe(true);
  });

  it('should reject access to another student exam session', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const otherStudentId = new Types.ObjectId().toString();
    const mockSession = {
      _id: new Types.ObjectId(),
      studentId: { toString: () => otherStudentId }, // different student
    };
    sessionRepository.findById.mockResolvedValue(mockSession as any);

    await expect(service.getSession(studentUser, mockSession._id.toString())).rejects.toThrow(
      ForbiddenException,
    );
  });
});
