import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { LessonProgress } from '../schemas/lesson-progress.schema';
import { ProgressStatus } from '../enums/progress-status.enum';
import { LessonProgressRepository } from '../repositories/lesson-progress.repository';

describe('LessonProgressRepository', () => {
  let repository: LessonProgressRepository;
  let lessonProgressModel: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockCountDocuments = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation(() => ({}));
    (MockModel as any).findOneAndUpdate = mockFindOneAndUpdate;
    (MockModel as any).findOne = mockFindOne;
    (MockModel as any).find = mockFind;
    (MockModel as any).countDocuments = mockCountDocuments;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonProgressRepository,
        {
          provide: getModelToken(LessonProgress.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get(LessonProgressRepository);
    lessonProgressModel = module.get(getModelToken(LessonProgress.name));
  });

  it('should upsert lesson progress by lesson id', async () => {
    const userId = new Types.ObjectId().toString();
    const lessonId = new Types.ObjectId().toString();
    const subjectId = new Types.ObjectId().toString();
    const chapterId = new Types.ObjectId().toString();
    const mockProgress = {
      _id: new Types.ObjectId(),
      toJSON: jest.fn().mockReturnValue({ status: ProgressStatus.COMPLETED }),
    };

    lessonProgressModel.findOneAndUpdate().exec.mockResolvedValue(mockProgress);

    const result = await repository.upsertByLessonId(
      userId,
      lessonId,
      {
        status: ProgressStatus.COMPLETED,
        progressPercent: 100,
        masteryScore: 92,
      },
      {
        subjectId,
        chapterId,
      },
    );

    expect(lessonProgressModel.findOneAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(mockProgress);
  });
});
