import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClassroomsService } from '../classrooms.service';
import { ClassroomRepository } from '../repositories/classroom.repository';
import { ClassroomMemberRepository } from '../repositories/classroom-member.repository';
import { ClassroomAssignmentRepository } from '../repositories/classroom-assignment.repository';
import { ClassroomSubmissionRepository } from '../repositories/classroom-submission.repository';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { SubmissionStatus } from '../enums/submission-status.enum';

describe('ClassroomsService', () => {
  let service: ClassroomsService;
  let classroomRepository: jest.Mocked<ClassroomRepository>;
  let memberRepository: jest.Mocked<ClassroomMemberRepository>;
  let assignmentRepository: jest.Mocked<ClassroomAssignmentRepository>;
  let submissionRepository: jest.Mocked<ClassroomSubmissionRepository>;

  const teacherUserId = new Types.ObjectId().toString();
  const studentUserId = new Types.ObjectId().toString();

  const teacherUser = { userId: teacherUserId, role: UserRole.TEACHER };
  const studentUser = { userId: studentUserId, role: UserRole.STUDENT };

  const mockClassroom = {
    _id: new Types.ObjectId(),
    teacherId: new Types.ObjectId(teacherUserId),
    name: 'Class 8 Math A',
    code: 'SHK8A1',
    classLevel: 8,
    medium: 'bangla',
    curriculumYear: 2026,
    isActive: true,
    toJSON: jest.fn().mockImplementation(function (this: any) {
      return { ...this };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomsService,
        {
          provide: ClassroomRepository,
          useValue: {
            createClassroom: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            findByTeacherId: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: ClassroomMemberRepository,
          useValue: {
            addMember: jest.fn(),
            isMember: jest.fn(),
            countMembers: jest.fn(),
            findByStudentId: jest.fn(),
            findByClassroomId: jest.fn(),
          },
        },
        {
          provide: ClassroomAssignmentRepository,
          useValue: {
            createAssignment: jest.fn(),
            findById: jest.fn(),
            findByClassroomId: jest.fn(),
          },
        },
        {
          provide: ClassroomSubmissionRepository,
          useValue: {
            submitAssignment: jest.fn(),
            findById: jest.fn(),
            findByAssignmentAndStudent: jest.fn(),
            findByAssignmentId: jest.fn(),
            gradeSubmission: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ClassroomsService);
    classroomRepository = module.get(ClassroomRepository);
    memberRepository = module.get(ClassroomMemberRepository);
    assignmentRepository = module.get(ClassroomAssignmentRepository);
    submissionRepository = module.get(ClassroomSubmissionRepository);
  });

  it('should create classroom with unique join code and register teacher as member', async () => {
    classroomRepository.findByCode.mockResolvedValue(null);
    classroomRepository.createClassroom.mockResolvedValue(mockClassroom as any);

    const result = await service.createClassroom(teacherUser, {
      name: 'Class 8 Math A',
      classLevel: 8,
      medium: 'bangla',
    });

    expect(result).toBeDefined();
    expect(result.name).toBe('Class 8 Math A');
    expect(memberRepository.addMember).toHaveBeenCalled();
  });

  it('should allow student to join classroom using join code', async () => {
    classroomRepository.findByCode.mockResolvedValue(mockClassroom as any);
    memberRepository.addMember.mockResolvedValue({
      classroomId: mockClassroom._id,
      studentId: new Types.ObjectId(studentUserId),
      toJSON: () => ({ role: 'student' }),
    } as any);

    const result = await service.joinClassroom(studentUser, { code: 'SHK8A1' });
    expect(result.membership).toBeDefined();
    expect(result.classroom.code).toBe('SHK8A1');
  });

  it('should create assignment when teacher requests', async () => {
    classroomRepository.findById.mockResolvedValue(mockClassroom as any);
    assignmentRepository.createAssignment.mockResolvedValue({
      _id: new Types.ObjectId(),
      title: 'Math Quiz 1',
      toJSON: () => ({ title: 'Math Quiz 1' }),
    } as any);

    const result = await service.createAssignment(teacherUser, mockClassroom._id.toString(), {
      title: 'Math Quiz 1',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(result.title).toBe('Math Quiz 1');
  });

  it('should submit assignment and mark as submitted on time', async () => {
    memberRepository.isMember.mockResolvedValue(true);
    assignmentRepository.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      isPublished: true,
      dueDate: new Date(Date.now() + 86400000), // future due date
    } as any);

    submissionRepository.submitAssignment.mockResolvedValue({
      status: SubmissionStatus.SUBMITTED,
      content: 'Solution',
      toJSON: () => ({ status: SubmissionStatus.SUBMITTED, content: 'Solution' }),
    } as any);

    const result = await service.submitAssignment(
      studentUser,
      mockClassroom._id.toString(),
      new Types.ObjectId().toString(),
      { content: 'Solution' },
    );

    expect(result.status).toBe(SubmissionStatus.SUBMITTED);
  });

  it('should grade submission with score and teacher feedback', async () => {
    classroomRepository.findById.mockResolvedValue(mockClassroom as any);
    submissionRepository.gradeSubmission.mockResolvedValue({
      status: SubmissionStatus.GRADED,
      score: 95,
      teacherFeedback: 'Excellent work',
      toJSON: () => ({
        status: SubmissionStatus.GRADED,
        score: 95,
        teacherFeedback: 'Excellent work',
      }),
    } as any);

    const result = await service.gradeSubmission(
      teacherUser,
      mockClassroom._id.toString(),
      new Types.ObjectId().toString(),
      new Types.ObjectId().toString(),
      { score: 95, teacherFeedback: 'Excellent work' },
    );

    expect(result.status).toBe(SubmissionStatus.GRADED);
    expect(result.score).toBe(95);
  });
});
