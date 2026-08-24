import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PracticeQuestion } from '../schemas/practice-question.schema';
import { PracticeQuestionType } from '../enums/practice-question-type.enum';
import { PracticeQuestionRepository } from '../repositories/practice-question.repository';

describe('PracticeQuestionRepository', () => {
  let repository: PracticeQuestionRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ exec: mockExec }),
      }),
    });
    const mockFindById = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation(() => ({}));
    (MockModel as any).find = mockFind;
    (MockModel as any).findById = mockFindById;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeQuestionRepository,
        { provide: getModelToken(PracticeQuestion.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(PracticeQuestionRepository);
    model = module.get(getModelToken(PracticeQuestion.name));
  });

  it('should list published practice questions by lesson', async () => {
    const questions = [
      {
        _id: new Types.ObjectId(),
        questionType: PracticeQuestionType.MCQ,
      },
    ];

    model.find().sort().limit().exec.mockResolvedValue(questions);

    const result = await repository.findPublishedByLesson('64b8268b6cb348e3b53f3131', 5);

    expect(model.find).toHaveBeenCalled();
    expect(result).toEqual(questions);
  });
});
