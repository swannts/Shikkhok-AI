import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExamSessionRepository } from '../repositories/exam-session.repository';
import { ExamSession } from '../schemas/exam-session.schema';
import { ExamSessionStatus } from '../enums/exam-session-status.enum';

describe('ExamSessionRepository', () => {
  let repository: ExamSessionRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.findById = jest.fn();
    model.findOne = jest.fn();
    model.find = jest.fn();
    model.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSessionRepository,
        {
          provide: getModelToken(ExamSession.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(ExamSessionRepository);
  });

  it('should create an exam session', async () => {
    const data = {
      studentId: new Types.ObjectId().toString(),
      examId: new Types.ObjectId().toString(),
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      status: ExamSessionStatus.ACTIVE,
    };

    const result = await repository.createSession(data);
    expect(result).toBeDefined();
    expect(result.status).toBe(ExamSessionStatus.ACTIVE);
  });

  it('should submit an exam session with score summary', async () => {
    const sessionId = new Types.ObjectId().toString();
    const mockExec = jest.fn().mockResolvedValue({
      _id: sessionId,
      status: ExamSessionStatus.SUBMITTED,
      score: 80,
      percentage: 80,
    });
    model.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

    const result = await repository.submitSession(sessionId, {
      score: 80,
      percentage: 80,
      correctCount: 4,
      wrongCount: 1,
      unansweredCount: 0,
      submittedAt: new Date(),
    });

    expect(result).toBeDefined();
    expect(result?.status).toBe(ExamSessionStatus.SUBMITTED);
  });
});
