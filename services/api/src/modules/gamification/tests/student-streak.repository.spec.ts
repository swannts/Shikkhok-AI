import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { StudentStreakRepository } from '../repositories/student-streak.repository';
import { StudentStreak } from '../schemas/student-streak.schema';

describe('StudentStreakRepository', () => {
  let repository: StudentStreakRepository;
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
    model.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentStreakRepository,
        {
          provide: getModelToken(StudentStreak.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(StudentStreakRepository);
  });

  it('should find or create a new student streak record', async () => {
    model.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const studentId = new Types.ObjectId().toString();
    const result = await repository.findOrCreate(studentId);

    expect(result).toBeDefined();
    expect(result.currentStreak).toBe(0);
    expect(result.freezeDaysRemaining).toBe(1);
  });

  it('should add points to student streak record', async () => {
    const studentId = new Types.ObjectId().toString();
    const mockExec = jest.fn().mockResolvedValue({
      studentId: new Types.ObjectId(studentId),
      totalPoints: 150,
    });
    model.findOneAndUpdate.mockReturnValue({ exec: mockExec });

    const result = await repository.addPoints(studentId, 50);
    expect(result?.totalPoints).toBe(150);
  });
});
