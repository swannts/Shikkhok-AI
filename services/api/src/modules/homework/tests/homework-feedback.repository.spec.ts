import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { HomeworkFeedbackRepository } from '../repositories/homework-feedback.repository';
import { HomeworkFeedback } from '../schemas/homework-feedback.schema';

describe('HomeworkFeedbackRepository', () => {
  let repository: HomeworkFeedbackRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.findOne = jest.fn();
    model.findOneAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkFeedbackRepository,
        {
          provide: getModelToken(HomeworkFeedback.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(HomeworkFeedbackRepository);
  });

  it('should create feedback for a homework submission', async () => {
    const submissionId = new Types.ObjectId().toString();
    const studentId = new Types.ObjectId().toString();

    const result = await repository.createFeedback({
      submissionId,
      studentId,
      summary: 'Good attempt',
      strengths: ['Clear handwriting'],
      weaknesses: ['Minor sign error'],
      recommendations: ['Practice chapter 2 examples'],
    });

    expect(result).toBeDefined();
    expect(result.summary).toBe('Good attempt');
  });

  it('should update feedback rating', async () => {
    const submissionId = new Types.ObjectId().toString();
    const mockExec = jest.fn().mockResolvedValue({
      submissionId,
      rating: 5,
    });
    model.findOneAndUpdate.mockReturnValue({ exec: mockExec });

    const result = await repository.setRating(submissionId, 5);
    expect(result?.rating).toBe(5);
  });
});
