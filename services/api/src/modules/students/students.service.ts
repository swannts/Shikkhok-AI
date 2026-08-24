import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { StudentProfileRepository } from './repositories/student-profile.repository';
import { UpsertStudentProfileDto } from './dto/upsert-student-profile.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { StudentProfileDocument } from './schemas/student-profile.schema';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentProfileRepository: StudentProfileRepository,
    private readonly usersService: UsersService,
  ) {}

  async getMyProfile(userId: string): Promise<Record<string, any>> {
    const profile = await this.studentProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }
    return profile.toJSON();
  }

  async upsertMyProfile(
    currentUser: AuthenticatedUser,
    dto: UpsertStudentProfileDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentAccount(currentUser.userId, currentUser.role);

    const profile = await this.studentProfileRepository.upsertByUserId(currentUser.userId, {
      classLevel: dto.classLevel,
      medium: dto.medium,
      curriculumYear: dto.curriculumYear,
      schoolName: dto.schoolName?.trim(),
      district: dto.district?.trim(),
      upazila: dto.upazila?.trim(),
      board: dto.board?.trim(),
      academicStream: dto.academicStream?.trim(),
      guardianPhone: dto.guardianPhone?.trim(),
      preferredSubjects: dto.preferredSubjects?.map((subject) => subject.trim()) ?? [],
      learningGoals: dto.learningGoals?.map((goal) => goal.trim()) ?? [],
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
    });

    return profile.toJSON();
  }

  async getProfileByUserId(userId: string): Promise<Record<string, any>> {
    await this.assertStudentAccount(userId);

    const profile = await this.studentProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }
    return profile.toJSON();
  }

  private async assertStudentAccount(userId: string, role?: string): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (role && role !== UserRole.STUDENT && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can manage student profiles');
    }

    if (user.role !== UserRole.STUDENT) {
      throw new BadRequestException('The linked user account is not a student account');
    }
  }
}
