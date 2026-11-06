import { ApiProperty } from '@nestjs/swagger';
import { AssignmentType } from '../enums/assignment-type.enum';
import { SubmissionStatus } from '../enums/submission-status.enum';
import { ClassroomRole } from '../enums/classroom-role.enum';

export class ClassroomResponseDto {
  @ApiProperty({ description: 'Classroom ID' })
  _id: string;

  @ApiProperty({ description: 'Teacher User ID' })
  teacherId: string;

  @ApiProperty({ description: 'Classroom title / name' })
  name: string;

  @ApiProperty({ description: 'Unique 6-character uppercase join code' })
  code: string;

  @ApiProperty({ description: 'NCTB Class Level (1-12)' })
  classLevel: number;

  @ApiProperty({ description: 'Curriculum medium (bangla/english)' })
  medium: string;

  @ApiProperty({ description: 'Curriculum year (e.g. 2026)' })
  curriculumYear: number;

  @ApiProperty({ required: false, description: 'Subject ID if classroom is subject-specific' })
  subjectId?: string | null;

  @ApiProperty({ required: false, description: 'Section identifier' })
  section?: string;

  @ApiProperty({ required: false, description: 'Description of the classroom' })
  description?: string;

  @ApiProperty({ description: 'Whether classroom is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string | Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: string | Date;
}

export class ClassroomDetailResponseDto extends ClassroomResponseDto {
  @ApiProperty({ description: 'Total enrolled members count' })
  memberCount: number;

  @ApiProperty({ description: 'Active assignments count' })
  assignmentCount: number;

  @ApiProperty({ description: 'Role of the requesting user in this classroom' })
  myRole: string;
}

export class ClassroomAssignmentResponseDto {
  @ApiProperty({ description: 'Assignment ID' })
  _id: string;

  @ApiProperty({ description: 'Classroom ID' })
  classroomId: string;

  @ApiProperty({ description: 'Teacher User ID who published the assignment' })
  teacherId: string;

  @ApiProperty({ description: 'Assignment Title' })
  title: string;

  @ApiProperty({ required: false, description: 'Assignment instructions/details' })
  description?: string;

  @ApiProperty({ enum: AssignmentType, description: 'Type of assignment' })
  assignmentType: AssignmentType;

  @ApiProperty({ required: false, description: 'Optional curriculum reference ID' })
  referenceId?: string | null;

  @ApiProperty({ description: 'Due date timestamp' })
  dueDate: Date | string;

  @ApiProperty({ description: 'Maximum score possible' })
  maxScore: number;

  @ApiProperty({ description: 'Whether assignment is published' })
  isPublished: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string | Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: string | Date;
}

export class ClassroomSubmissionResponseDto {
  @ApiProperty({ description: 'Submission ID' })
  _id: string;

  @ApiProperty({ description: 'Assignment ID' })
  assignmentId: string;

  @ApiProperty({ description: 'Classroom ID' })
  classroomId: string;

  @ApiProperty({ description: 'Student User ID' })
  studentId: string;

  @ApiProperty({ description: 'Text content of the submission' })
  content: string;

  @ApiProperty({ type: [String], description: 'Optional attachment URLs' })
  attachmentUrls: string[];

  @ApiProperty({ description: 'Submission timestamp' })
  submittedAt: Date | string;

  @ApiProperty({ enum: SubmissionStatus, description: 'Status of the submission' })
  status: SubmissionStatus;

  @ApiProperty({ required: false, description: 'Score awarded by teacher' })
  score?: number | null;

  @ApiProperty({ required: false, description: 'Teacher feedback text' })
  teacherFeedback?: string | null;

  @ApiProperty({ required: false, description: 'Grading timestamp' })
  gradedAt?: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string | Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: string | Date;
}

export class ClassroomMemberResponseDto {
  @ApiProperty({ description: 'Membership ID' })
  _id: string;

  @ApiProperty({ description: 'Classroom ID' })
  classroomId: string;

  @ApiProperty({ description: 'Student User ID' })
  studentId: string;

  @ApiProperty({ enum: ClassroomRole, description: 'Classroom role' })
  role: ClassroomRole;

  @ApiProperty({ description: 'Joined at timestamp' })
  joinedAt: Date | string;
}
