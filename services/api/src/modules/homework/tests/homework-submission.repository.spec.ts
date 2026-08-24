import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { HomeworkSubmissionRepository } from '../repositories/homework-submission.repository';
import { HomeworkSubmission } from '../schemas/homework-submission.schema';
import { HomeworkStatus } from '../enums/homework-status.enum';

describe('HomeworkSubmissionRepository', () => {
  let repository: HomeworkSubmissionRepository;
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
    model.find = jest.fn();
    model.countDocuments = jest.fn();
    model.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkSubmissionRepository,
        {
          provide: getModelToken(HomeworkSubmission.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(HomeworkSubmissionRepository);
  });

  it('should create a homework submission with pending status', async () => {
    const studentId = new Types.ObjectId().toString();
    const result = await repository.createSubmission({
      studentId,
      imageUrls: ['https://storage.shikkhok.ai/hw1.png'],
      prompt: 'Check step 2',
    });

    expect(result).toBeDefined();
    expect(result.status).toBe(HomeworkStatus.PENDING);
    expect(result.imageUrls).toEqual(['https://storage.shikkhok.ai/hw1.png']);
  });

  it('should update homework status and ocrText', async () => {
    const id = new Types.ObjectId().toString();
    const mockExec = jest.fn().mockResolvedValue({
      _id: id,
      status: HomeworkStatus.COMPLETED,
      ocrText: 'Extracted math problem',
    });
    model.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

    const result = await repository.updateStatus(id, HomeworkStatus.COMPLETED, {
      ocrText: 'Extracted math problem',
    });

    expect(result).toBeDefined();
    expect(result?.status).toBe(HomeworkStatus.COMPLETED);
    expect(result?.ocrText).toBe('Extracted math problem');
  });
});
