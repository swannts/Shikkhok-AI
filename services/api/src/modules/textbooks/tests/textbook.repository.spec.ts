import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TextbookRepository } from '../repositories/textbook.repository';
import { Textbook } from '../schemas/textbook.schema';

describe('TextbookRepository', () => {
  let repository: TextbookRepository;
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
        TextbookRepository,
        {
          provide: getModelToken(Textbook.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(TextbookRepository);
  });

  it('should create a textbook record', async () => {
    const result = await repository.createTextbook({
      title: 'Class 8 Mathematics',
      titleBn: 'অষ্টম শ্রেণি গণিত',
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
      isPublished: true,
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Class 8 Mathematics');
  });

  it('should query published textbooks by class and medium', async () => {
    const mockExec = jest.fn().mockResolvedValue([{ title: 'Class 8 Math' }]);
    const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
    model.find.mockReturnValue({ sort: mockSort });

    const result = await repository.findPublished({
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    });

    expect(model.find).toHaveBeenCalledWith({
      isPublished: true,
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    });
    expect(result).toHaveLength(1);
  });
});
