import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { Classroom, ClassroomSchema } from './schemas/classroom.schema';
import { ClassroomMember, ClassroomMemberSchema } from './schemas/classroom-member.schema';
import {
  ClassroomAssignment,
  ClassroomAssignmentSchema,
} from './schemas/classroom-assignment.schema';
import {
  ClassroomSubmission,
  ClassroomSubmissionSchema,
} from './schemas/classroom-submission.schema';
import { ClassroomRepository } from './repositories/classroom.repository';
import { ClassroomMemberRepository } from './repositories/classroom-member.repository';
import { ClassroomAssignmentRepository } from './repositories/classroom-assignment.repository';
import { ClassroomSubmissionRepository } from './repositories/classroom-submission.repository';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    CurriculumModule,
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: ClassroomMember.name, schema: ClassroomMemberSchema },
      { name: ClassroomAssignment.name, schema: ClassroomAssignmentSchema },
      { name: ClassroomSubmission.name, schema: ClassroomSubmissionSchema },
    ]),
  ],
  controllers: [ClassroomsController],
  providers: [
    ClassroomRepository,
    ClassroomMemberRepository,
    ClassroomAssignmentRepository,
    ClassroomSubmissionRepository,
    ClassroomsService,
  ],
  exports: [
    ClassroomsService,
    ClassroomRepository,
    ClassroomMemberRepository,
    ClassroomAssignmentRepository,
    ClassroomSubmissionRepository,
  ],
})
export class ClassroomsModule {}
