import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { HomeworkService } from '../homework.service';
import { HomeworkSubmissionRepository } from '../repositories/homework-submission.repository';
import { HomeworkFeedbackRepository } from '../repositories/homework-feedback.repository';
import { UsersService } from '../../users/users.service';
import { StudentsService } from '../../students/students.service';
import { CurriculumService } from '../../curriculum/curriculum.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { HomeworkStatus } from '../enums/homework-status.enum';
import { ConfigService } from '@nestjs/config';
import { AiGatewayService } from '../../ai-gateway/services/ai-gateway.service';

describe('HomeworkService', () => {
  let service: HomeworkService;
  let submissionRepository: jest.Mocked<HomeworkSubmissionRepository>;
  let feedbackRepository: jest.Mocked<HomeworkFeedbackRepository>;
  let usersService: jest.Mocked<UsersService>;
  let curriculumService: jest.Mocked<CurriculumService>;
  let configService: jest.Mocked<ConfigService>;
  let aiGatewayService: jest.Mocked<AiGatewayService>;

  const studentUserId = new Types.ObjectId().toString();
  const studentUser = { userId: studentUserId, role: UserRole.STUDENT };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkService,
        {
          provide: HomeworkSubmissionRepository,
          useValue: {
            createSubmission: jest.fn(),
            findById: jest.fn(),
            findByStudentId: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: HomeworkFeedbackRepository,
          useValue: {
            createFeedback: jest.fn(),
            findBySubmissionId: jest.fn(),
            setRating: jest.fn(),
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
        {
          provide: CurriculumService,
          useValue: {
            getLesson: jest.fn(),
            getChapter: jest.fn(),
            getSubject: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(false) },
        },
        {
          provide: AiGatewayService,
          useValue: {
            evaluateHomework: jest.fn().mockResolvedValue({
              summary: 'The answer was reviewed.',
              strengths: [],
              weaknesses: [],
              corrections: [],
              recommendations: [],
              citations: [],
            }),
          },
        },
      ],
    }).compile();

    service = module.get(HomeworkService);
    submissionRepository = module.get(HomeworkSubmissionRepository);
    feedbackRepository = module.get(HomeworkFeedbackRepository);
    usersService = module.get(UsersService);
    curriculumService = module.get(CurriculumService);
    configService = module.get(ConfigService);
    aiGatewayService = module.get(AiGatewayService);
  });

  it('should create a homework submission and trigger processing', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const mockSubmission = {
      _id: new Types.ObjectId(),
      studentId: new Types.ObjectId(studentUserId),
      imageUrls: ['https://storage.shikkhok.ai/hw.png'],
      status: HomeworkStatus.PENDING,
      toJSON: jest.fn().mockReturnValue({ status: HomeworkStatus.PENDING }),
    };
    submissionRepository.createSubmission.mockResolvedValue(mockSubmission as any);
    submissionRepository.findById.mockResolvedValue(mockSubmission as any);

    const result = await service.createSubmission(studentUser, {
      imageUrls: ['https://storage.shikkhok.ai/hw.png'],
      prompt: 'Check step 1',
    });

    expect(result).toBeDefined();
    expect(submissionRepository.createSubmission).toHaveBeenCalled();
  });

  it('should return feedback when submission is completed', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const submissionId = new Types.ObjectId().toString();
    submissionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentUserId),
      status: HomeworkStatus.COMPLETED,
    } as any);

    feedbackRepository.findBySubmissionId.mockResolvedValue({
      submissionId,
      summary: 'Well done',
      toJSON: jest.fn().mockReturnValue({ summary: 'Well done' }),
    } as any);

    const feedback = await service.getFeedback(studentUser, submissionId);
    expect(feedback.summary).toBe('Well done');
  });

  it('should reject getFeedback when submission is still processing', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const submissionId = new Types.ObjectId().toString();
    submissionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentUserId),
      status: HomeworkStatus.PROCESSING,
    } as any);

    await expect(service.getFeedback(studentUser, submissionId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should allow student to rate feedback from 1 to 5', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const submissionId = new Types.ObjectId().toString();
    submissionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentUserId),
      status: HomeworkStatus.COMPLETED,
    } as any);

    feedbackRepository.setRating.mockResolvedValue({
      submissionId,
      rating: 5,
      toJSON: jest.fn().mockReturnValue({ rating: 5 }),
    } as any);

    const result = await service.rateFeedback(studentUser, submissionId, { rating: 5 });
    expect(result.rating).toBe(5);
  });

  it('only stores a citation when the AI service supplies complete retrieved-source metadata', async () => {
    const submissionId = new Types.ObjectId().toString();
    const lessonId = new Types.ObjectId().toString();
    const chapterId = new Types.ObjectId().toString();
    const subjectId = new Types.ObjectId().toString();

    submissionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentUserId),
      lessonId: new Types.ObjectId(lessonId),
      chapterId: new Types.ObjectId(chapterId),
      subjectId: new Types.ObjectId(subjectId),
      prompt: 'বর্গের সূত্র',
      rawText: '(a+b)^2 = a^2 + 2ab + b^2',
      status: HomeworkStatus.PENDING,
    } as any);

    curriculumService.getLesson.mockResolvedValue({ title: 'বীজগণিতীয় সূত্রাবলি' } as any);
    curriculumService.getChapter.mockResolvedValue({ title: 'অধ্যায় ৪' } as any);
    curriculumService.getSubject.mockResolvedValue({ name: 'গণিত' } as any);
    configService.get.mockReturnValue(true);
    aiGatewayService.evaluateHomework.mockResolvedValue({
      summary: 'The answer was reviewed.',
      citations: [
        { sourceId: 'chunk-123', sourceBook: 'Class 8 Mathematics', excerpt: 'Verified passage' },
        { sourceId: 'made-up', sourceBook: 'Class 8 Mathematics' },
      ],
    });

    await service.processSubmission(submissionId);

    expect(submissionRepository.updateStatus).toHaveBeenCalledWith(
      submissionId,
      HomeworkStatus.PROCESSING,
    );
    expect(feedbackRepository.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId,
        citations: [
          expect.objectContaining({
            sourceId: 'chunk-123',
            sourceBook: 'Class 8 Mathematics',
            excerpt: 'Verified passage',
          }),
        ],
      }),
    );
    expect(submissionRepository.updateStatus).toHaveBeenCalledWith(
      submissionId,
      HomeworkStatus.COMPLETED,
      expect.anything(),
    );
  });

  it('marks homework failed rather than inventing an assessment when AI is unavailable', async () => {
    const submissionId = new Types.ObjectId().toString();
    submissionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentUserId),
      rawText: 'student answer',
      imageUrls: [],
    } as any);
    configService.get.mockReturnValue(false);

    await service.processSubmission(submissionId);

    expect(feedbackRepository.createFeedback).not.toHaveBeenCalled();
    expect(submissionRepository.updateStatus).toHaveBeenCalledWith(
      submissionId,
      HomeworkStatus.FAILED,
      expect.objectContaining({ errorMessage: expect.stringContaining('AI মূল্যায়ন') }),
    );
  });

  it('should reject access to another student homework submission for non-admin', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    const submissionId = new Types.ObjectId().toString();
    const otherStudentId = new Types.ObjectId().toString();

    submissionRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(otherStudentId),
    } as any);

    await expect(service.getSubmission(studentUser, submissionId)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
