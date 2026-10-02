import 'reflect-metadata';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/enums/user-role.enum';
import { ParentsController } from '../../modules/parents/parents.controller';
import { ClassroomsController } from '../../modules/classrooms/classrooms.controller';
import { StudentsController } from '../../modules/students/students.controller';
import { TextbooksController } from '../../modules/textbooks/textbooks.controller';
import { AdminController } from '../../modules/admin/admin.controller';

describe('role metadata policy', () => {
  it('restricts parent endpoints to parent/admin roles', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ParentsController)).toEqual([
      UserRole.PARENT,
      UserRole.ADMIN,
    ]);
  });

  it('restricts classroom mutations and student actions by role', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ClassroomsController.prototype.createClassroom)).toEqual([
      UserRole.TEACHER,
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, ClassroomsController.prototype.submitAssignment)).toEqual([
      UserRole.STUDENT,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, ClassroomsController.prototype.gradeSubmission)).toEqual([
      UserRole.TEACHER,
      UserRole.ADMIN,
    ]);
  });

  it('keeps student profile lookup admin-only while student self-service is student-only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController)).toEqual([UserRole.STUDENT]);
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.getProfileByUserId)).toEqual([
      UserRole.ADMIN,
    ]);
  });

  it('declares textbook reads for supported authenticated roles', () => {
    expect(Reflect.getMetadata(ROLES_KEY, TextbooksController)).toEqual([
      UserRole.STUDENT,
      UserRole.PARENT,
      UserRole.TEACHER,
      UserRole.ADMIN,
    ]);
  });

  it('keeps the complete admin controller admin-only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminController)).toEqual([UserRole.ADMIN]);
  });
});
