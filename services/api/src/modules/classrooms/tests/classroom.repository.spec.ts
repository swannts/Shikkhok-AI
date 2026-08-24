import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClassroomRepository } from '../repositories/classroom.repository';
import { Classroom } from '../schemas/classroom.schema';

describe('ClassroomRepository', () => {
  let repository: ClassroomRepository;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomRepository,
        {
          provide: getModelToken(Classroom.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(ClassroomRepository);
  });

  it('should create a classroom record', async () => {
    const teacherId = new Types.ObjectId();
    const result = await repository.createClassroom({
      teacherId,
      name: 'Class 8 Math',
      code: 'SHK8M1',
      classLevel: 8,
      medium: 'bangla',
      curriculumYear: 2026,
    });

    expect(result).toBeDefined();
    expect(result.code).toBe('SHK8M1');
  });

  it('should find classroom by unique join code', async () => {
    const mockExec = jest.fn().mockResolvedValue({ code: 'SHK8M1' });
    model.findOne.mockReturnValue({ exec: mockExec });

    const result = await repository.findByCode('shk8m1');
    expect(result).toBeDefined();
    expect(model.findOne).toHaveBeenCalledWith({ code: 'SHK8M1' });
  });
});
