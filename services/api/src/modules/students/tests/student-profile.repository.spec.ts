import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { StudentProfile, StudentProfileDocument } from '../schemas/student-profile.schema';
import { StudentMedium } from '../enums/student-medium.enum';
import { StudentProfileRepository } from '../repositories/student-profile.repository';

describe('StudentProfileRepository', () => {
  let repository: StudentProfileRepository;
  let studentProfileModel: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindById = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation(() => ({}));
    (MockModel as any).findOne = mockFindOne;
    (MockModel as any).findById = mockFindById;
    (MockModel as any).findOneAndUpdate = mockFindOneAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentProfileRepository,
        {
          provide: getModelToken(StudentProfile.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get(StudentProfileRepository);
    studentProfileModel = module.get(getModelToken(StudentProfile.name));
  });

  it('should find profile by user id', async () => {
    const mockProfile = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      classLevel: 8,
      medium: StudentMedium.BANGLA,
    };

    studentProfileModel.findOne().exec.mockResolvedValue(mockProfile);

    const result = await repository.findByUserId('user-1');

    expect(studentProfileModel.findOne).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result).toEqual(mockProfile);
  });

  it('should upsert a profile by user id', async () => {
    const mockProfile = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      classLevel: 8,
      medium: StudentMedium.BANGLA,
      curriculumYear: 2026,
    };

    studentProfileModel.findOneAndUpdate().exec.mockResolvedValue(mockProfile);

    const result = await repository.upsertByUserId('user-1', {
      classLevel: 8,
      medium: StudentMedium.BANGLA,
      curriculumYear: 2026,
      preferredSubjects: ['math'],
    });

    expect(studentProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      {
        $set: {
          classLevel: 8,
          medium: StudentMedium.BANGLA,
          curriculumYear: 2026,
          preferredSubjects: ['math'],
        },
        $setOnInsert: { userId: 'user-1' },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    expect(result).toEqual(mockProfile);
  });
});
