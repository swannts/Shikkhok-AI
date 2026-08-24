import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParentsService } from '../parents.service';
import { ParentProfileRepository } from '../repositories/parent-profile.repository';
import { UsersService } from '../../users/users.service';
import { StudentsService } from '../../students/students.service';
import { ProgressService } from '../../progress/progress.service';
import { UserRole } from '../../users/enums/user-role.enum';

describe('ParentsService', () => {
  let service: ParentsService;
  let parentProfileRepository: jest.Mocked<ParentProfileRepository>;
  let usersService: jest.Mocked<UsersService>;
  let studentsService: jest.Mocked<StudentsService>;
  let progressService: jest.Mocked<ProgressService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentsService,
        {
          provide: ParentProfileRepository,
          useValue: {
            findByUserId: jest.fn(),
            upsertProfile: jest.fn(),
            addLinkedStudent: jest.fn(),
            removeLinkedStudent: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByEmailOrPhone: jest.fn(),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getSummaryForUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ParentsService);
    parentProfileRepository = module.get(ParentProfileRepository);
    usersService = module.get(UsersService);
    studentsService = module.get(StudentsService);
    progressService = module.get(ProgressService);
  });

  it('should return parent profile', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ displayName: 'Parent' }),
    } as any);

    await expect(
      service.getMyProfile({ userId: 'parent-1', role: UserRole.PARENT }),
    ).resolves.toEqual({ displayName: 'Parent' });
  });

  it('should reject non-parent accounts', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);

    await expect(
      service.getMyProfile({ userId: 'student-1', role: UserRole.STUDENT }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should link a child by email or phone lookup', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    usersService.findByEmailOrPhone.mockResolvedValue({
      _id: new Types.ObjectId(),
      role: UserRole.STUDENT,
    } as any);
    parentProfileRepository.addLinkedStudent.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ linkedStudentIds: ['child-1'] }),
    } as any);

    const result = await service.linkChild(
      { userId: 'parent-1', role: UserRole.PARENT },
      { studentIdentifier: '01712345678' },
    );

    expect(result).toEqual({ linkedStudentIds: ['child-1'] });
  });

  it('should reject unlinked child dashboard access', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      linkedStudentIds: [],
    } as any);

    await expect(
      service.getChildDashboard({ userId: 'parent-1', role: UserRole.PARENT }, 'child-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should build a child dashboard for linked child', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.PARENT } as any);
    parentProfileRepository.findByUserId.mockResolvedValue({
      linkedStudentIds: [new Types.ObjectId('64b8268b6cb348e3b53f4100')],
    } as any);
    studentsService.getProfileByUserId.mockResolvedValue({ name: 'Child' } as any);
    progressService.getSummaryForUserId.mockResolvedValue({ totalLessons: 2 } as any);

    const result = await service.getChildDashboard(
      { userId: 'parent-1', role: UserRole.PARENT },
      '64b8268b6cb348e3b53f4100',
    );

    expect(result.summary.totalLessons).toBe(2);
    expect(result.childProfile.name).toBe('Child');
  });
});
