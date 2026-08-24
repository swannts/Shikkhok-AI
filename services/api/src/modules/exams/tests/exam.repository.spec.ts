import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExamRepository } from '../repositories/exam.repository';
import { Exam } from '../schemas/exam.schema';
import { ExamStatus } from '../enums/exam-status.enum';

describe('ExamRepository', () => {
  let repository: ExamRepository;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamRepository,
        {
          provide: getModelToken(Exam.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(ExamRepository);
  });

  it('should create an exam', async () => {
    const data = {
      title: 'Math Midterm',
      titleBn: 'গণিত অর্ধবার্ষিকী',
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
      timeLimitMinutes: 60,
      totalMarks: 100,
      status: ExamStatus.PUBLISHED,
    };

    const result = await repository.createExam(data as any);
    expect(result).toBeDefined();
    expect(result.title).toBe('Math Midterm');
  });

  it('should find published exams with filters', async () => {
    const mockExec = jest.fn().mockResolvedValue([{ title: 'Math Midterm' }]);
    const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
    model.find.mockReturnValue({ sort: mockSort });

    const result = await repository.findPublished({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    });

    expect(model.find).toHaveBeenCalledWith({
      status: ExamStatus.PUBLISHED,
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    });
    expect(result).toHaveLength(1);
  });
});
