import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { StudentsService } from '../students.service';
import { StudentProfileRepository } from '../repositories/student-profile.repository';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { StudentMedium } from '../enums/student-medium.enum';

function createFakeStudentUser(overrides: Record<string, any> = {}) {
  return {
    _id: new Types.ObjectId(),
    role: UserRole.STUDENT,
    toJSON() {
      return this;
    },
    ...overrides,
  };
}

describe('StudentsService', () => {
  let service: StudentsService;
  let studentProfileRepository: jest.Mocked<StudentProfileRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: StudentProfileRepository,
          useValue: {
            findByUserId: jest.fn(),
            findById: jest.fn(),
            upsertByUserId: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByEmailOrPhone: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StudentsService);
    studentProfileRepository = module.get(StudentProfileRepository);
    usersService = module.get(UsersService);
  });

  it('should return my profile', async () => {
    const profile = {
      toJSON: jest.fn().mockReturnValue({ classLevel: 8 }),
    };

    studentProfileRepository.findByUserId.mockResolvedValue(profile as any);

    await expect(service.getMyProfile('user-1')).resolves.toEqual({ classLevel: 8 });
  });

  it('should throw if profile is missing', async () => {
    studentProfileRepository.findByUserId.mockResolvedValue(null);

    await expect(service.getMyProfile('user-1')).rejects.toThrow(NotFoundException);
  });

  it('should upsert profile for a student account', async () => {
    const student = createFakeStudentUser();
    const profile = {
      toJSON: jest.fn().mockReturnValue({ classLevel: 8, medium: StudentMedium.BANGLA }),
    };

    usersService.findById.mockResolvedValue(student as any);
    studentProfileRepository.upsertByUserId.mockResolvedValue(profile as any);

    const result = await service.upsertMyProfile(
      { userId: student._id.toString(), role: UserRole.STUDENT },
      {
        classLevel: 8,
        medium: StudentMedium.BANGLA,
        curriculumYear: 2026,
      },
    );

    expect(result).toEqual({ classLevel: 8, medium: StudentMedium.BANGLA });
    expect(studentProfileRepository.upsertByUserId).toHaveBeenCalledWith(student._id.toString(), {
      classLevel: 8,
      medium: StudentMedium.BANGLA,
      curriculumYear: 2026,
      schoolName: undefined,
      district: undefined,
      upazila: undefined,
      board: undefined,
      academicStream: undefined,
      guardianPhone: undefined,
      preferredSubjects: [],
      learningGoals: [],
      dateOfBirth: undefined,
    });
  });

  it('should reject non-student accounts', async () => {
    usersService.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      role: UserRole.PARENT,
    } as any);

    await expect(
      service.upsertMyProfile(
        { userId: 'user-1', role: UserRole.PARENT },
        {
          classLevel: 8,
          medium: StudentMedium.BANGLA,
          curriculumYear: 2026,
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject missing linked user records', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.upsertMyProfile(
        { userId: 'user-1', role: UserRole.STUDENT },
        {
          classLevel: 8,
          medium: StudentMedium.BANGLA,
          curriculumYear: 2026,
        },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return a student profile by user id for admin access', async () => {
    usersService.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      role: UserRole.STUDENT,
    } as any);

    const profile = {
      toJSON: jest.fn().mockReturnValue({ classLevel: 8 }),
    };

    studentProfileRepository.findByUserId.mockResolvedValue(profile as any);

    await expect(service.getProfileByUserId('user-1')).resolves.toEqual({ classLevel: 8 });
  });
});
