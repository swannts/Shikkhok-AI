import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Subject } from '../schemas/subject.schema';
import { CurriculumMedium } from '../enums/curriculum-medium.enum';
import { SubjectRepository } from '../repositories/subject.repository';

describe('SubjectRepository', () => {
  let repository: SubjectRepository;
  let subjectModel: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockFindById = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation(() => ({}));
    (MockModel as any).find = mockFind;
    (MockModel as any).findById = mockFindById;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectRepository, { provide: getModelToken(Subject.name), useValue: MockModel }],
    }).compile();

    repository = module.get(SubjectRepository);
    subjectModel = module.get(getModelToken(Subject.name));
  });

  it('should find published subjects by class filter', async () => {
    const mockSubjects = [
      {
        _id: new Types.ObjectId(),
        toJSON: jest.fn().mockReturnValue({ name: 'Mathematics' }),
      },
    ];

    subjectModel.find().sort().exec.mockResolvedValue(mockSubjects);

    const result = await repository.findPublishedByFilter({
      classLevel: 8,
      medium: CurriculumMedium.BANGLA,
      curriculumYear: 2026,
    });

    expect(subjectModel.find).toHaveBeenCalledWith({
      classLevel: 8,
      medium: CurriculumMedium.BANGLA,
      curriculumYear: 2026,
      isPublished: true,
    });
    expect(result).toEqual(mockSubjects);
  });
});
