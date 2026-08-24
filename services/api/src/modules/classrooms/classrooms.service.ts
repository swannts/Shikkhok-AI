import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { ClassroomRepository } from './repositories/classroom.repository';
import { ClassroomMemberRepository } from './repositories/classroom-member.repository';
import { ClassroomAssignmentRepository } from './repositories/classroom-assignment.repository';
import { ClassroomSubmissionRepository } from './repositories/classroom-submission.repository';
import { ClassroomRole } from './enums/classroom-role.enum';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';

@Injectable()
export class ClassroomsService {
  constructor(
    private readonly classroomRepository: ClassroomRepository,
    private readonly memberRepository: ClassroomMemberRepository,
    private readonly assignmentRepository: ClassroomAssignmentRepository,
    private readonly submissionRepository: ClassroomSubmissionRepository,
    private readonly usersService: UsersService,
  ) {}

  async createClassroom(
    currentUser: AuthenticatedUser,
    dto: CreateClassroomDto,
  ): Promise<Record<string, any>> {
    this.assertTeacherOrAdmin(currentUser);

    const code = await this.generateUniqueCode();
    const classroom = await this.classroomRepository.createClassroom({
      teacherId: new Types.ObjectId(currentUser.userId),
      name: dto.name.trim(),
      code,
      classLevel: dto.classLevel,
      medium: dto.medium?.toLowerCase()?.trim() ?? 'bangla',
      curriculumYear: dto.curriculumYear ?? 2026,
      subjectId: dto.subjectId ? new Types.ObjectId(dto.subjectId) : null,
      description: dto.description?.trim(),
      isActive: true,
    });

    // Add teacher as classroom member
    await this.memberRepository.addMember(
      classroom._id.toString(),
      currentUser.userId,
      ClassroomRole.TEACHER,
    );

    return classroom.toJSON();
  }

  async listTeaching(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    this.assertTeacherOrAdmin(currentUser);
    const classrooms = await this.classroomRepository.findByTeacherId(currentUser.userId);
    return Promise.all(
      classrooms.map(async (c) => {
        const memberCount = await this.memberRepository.countMembers(c._id.toString());
        return {
          ...c.toJSON(),
          memberCount,
        };
      }),
    );
  }

  async listEnrolled(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    const memberships = await this.memberRepository.findByStudentId(currentUser.userId);
    const classroomIds = memberships.map((m) => m.classroomId);
    const classrooms = await this.classroomRepository.findByIds(classroomIds);

    const classroomMap = new Map<string, any>();
    for (const c of classrooms) {
      classroomMap.set(c._id.toString(), c.toJSON());
    }

    return memberships
      .filter((m) => classroomMap.has(m.classroomId.toString()))
      .map((m) => ({
        membership: m.toJSON(),
        classroom: classroomMap.get(m.classroomId.toString()),
      }));
  }

  async joinClassroom(
    currentUser: AuthenticatedUser,
    dto: JoinClassroomDto,
  ): Promise<Record<string, any>> {
    const classroom = await this.classroomRepository.findByCode(dto.code);
    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Invalid or inactive classroom join code');
    }

    const member = await this.memberRepository.addMember(
      classroom._id.toString(),
      currentUser.userId,
      ClassroomRole.STUDENT,
    );

    return {
      membership: member?.toJSON(),
      classroom: classroom.toJSON(),
    };
  }

  async getClassroom(
    currentUser: AuthenticatedUser,
    classroomId: string,
  ): Promise<Record<string, any>> {
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Classroom not found');
    }

    await this.assertClassroomAccess(currentUser, classroom);

    const [memberCount, assignments] = await Promise.all([
      this.memberRepository.countMembers(classroomId),
      this.assignmentRepository.findByClassroomId(classroomId),
    ]);

    return {
      ...classroom.toJSON(),
      memberCount,
      assignments: assignments.map((a) => a.toJSON()),
    };
  }

  async createAssignment(
    currentUser: AuthenticatedUser,
    classroomId: string,
    dto: CreateAssignmentDto,
  ): Promise<Record<string, any>> {
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Classroom not found');
    }

    this.assertClassroomTeacher(currentUser, classroom);

    const assignment = await this.assignmentRepository.createAssignment({
      classroomId: classroom._id,
      teacherId: new Types.ObjectId(currentUser.userId),
      title: dto.title.trim(),
      description: dto.description?.trim(),
      assignmentType: dto.assignmentType,
      referenceId: dto.referenceId,
      dueDate: new Date(dto.dueDate),
      maxScore: dto.maxScore ?? 100,
      isPublished: true,
    });

    return assignment.toJSON();
  }

  async listAssignments(
    currentUser: AuthenticatedUser,
    classroomId: string,
  ): Promise<Record<string, any>[]> {
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Classroom not found');
    }

    await this.assertClassroomAccess(currentUser, classroom);

    const assignments = await this.assignmentRepository.findByClassroomId(classroomId);
    return assignments.map((a) => a.toJSON());
  }

  async submitAssignment(
    currentUser: AuthenticatedUser,
    classroomId: string,
    assignmentId: string,
    dto: SubmitAssignmentDto,
  ): Promise<Record<string, any>> {
    const isMember = await this.memberRepository.isMember(classroomId, currentUser.userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this classroom to submit assignments');
    }

    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment || !assignment.isPublished) {
      throw new NotFoundException('Assignment not found');
    }

    const now = new Date();
    const isLate = now.getTime() > assignment.dueDate.getTime();

    const submission = await this.submissionRepository.submitAssignment({
      assignmentId,
      classroomId,
      studentId: currentUser.userId,
      content: dto.content.trim(),
      attachmentUrls: dto.attachmentUrls ?? [],
      isLate,
    });

    return submission ? submission.toJSON() : {};
  }

  async listSubmissions(
    currentUser: AuthenticatedUser,
    classroomId: string,
    assignmentId: string,
  ): Promise<Record<string, any>[]> {
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }
    this.assertClassroomTeacher(currentUser, classroom);

    const submissions = await this.submissionRepository.findByAssignmentId(assignmentId);
    return submissions.map((s) => s.toJSON());
  }

  async gradeSubmission(
    currentUser: AuthenticatedUser,
    classroomId: string,
    assignmentId: string,
    submissionId: string,
    dto: GradeAssignmentDto,
  ): Promise<Record<string, any>> {
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }
    this.assertClassroomTeacher(currentUser, classroom);

    const graded = await this.submissionRepository.gradeSubmission(
      submissionId,
      dto.score,
      dto.teacherFeedback?.trim(),
    );

    if (!graded) {
      throw new NotFoundException('Submission not found');
    }

    return graded.toJSON();
  }

  private assertTeacherOrAdmin(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== UserRole.TEACHER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only teachers or admins can manage classrooms');
    }
  }

  private assertClassroomTeacher(currentUser: AuthenticatedUser, classroom: any): void {
    const teacherId = classroom.teacherId?.toString?.() ?? classroom.teacherId;
    if (teacherId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the classroom teacher can perform this action');
    }
  }

  private async assertClassroomAccess(
    currentUser: AuthenticatedUser,
    classroom: any,
  ): Promise<void> {
    const teacherId = classroom.teacherId?.toString?.() ?? classroom.teacherId;
    if (teacherId === currentUser.userId || currentUser.role === UserRole.ADMIN) {
      return;
    }

    const isMember = await this.memberRepository.isMember(
      classroom._id.toString(),
      currentUser.userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this classroom');
    }
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 6; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const exists = await this.classroomRepository.findByCode(code);
      if (!exists) {
        return code;
      }
    }
    return `SHK${Math.floor(100 + Math.random() * 900)}`;
  }
}
