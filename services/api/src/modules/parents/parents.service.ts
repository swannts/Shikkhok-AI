import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { ParentProfileRepository } from './repositories/parent-profile.repository';
import { UpsertParentProfileDto } from './dto/upsert-parent-profile.dto';
import { LinkChildDto } from './dto/link-child.dto';
import { StudentsService } from '../students/students.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentProfileRepository: ParentProfileRepository,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly progressService: ProgressService,
  ) {}

  async getMyProfile(currentUser: AuthenticatedUser): Promise<Record<string, any>> {
    await this.assertParentOrAdmin(currentUser);
    return this.getOrCreateProfile(currentUser.userId);
  }

  async upsertMyProfile(
    currentUser: AuthenticatedUser,
    dto: UpsertParentProfileDto,
  ): Promise<Record<string, any>> {
    await this.assertParentOrAdmin(currentUser);
    const profile = await this.parentProfileRepository.upsertProfile(currentUser.userId, {
      displayName: dto.displayName?.trim(),
      phone: dto.phone?.trim(),
      homeDistrict: dto.homeDistrict?.trim(),
      relationNote: dto.relationNote?.trim(),
    });
    return profile.toJSON();
  }

  async listLinkedChildren(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    const profile = await this.getOrCreateProfile(currentUser.userId);
    const linkedStudentIds = profile.linkedStudentIds ?? [];
    const children = [];

    for (const childId of linkedStudentIds) {
      const child = await this.studentsService.getProfileByUserId(childId);
      const summary = await this.progressService.getSummaryForUserId(childId);
      children.push({
        child,
        summary,
      });
    }

    return children;
  }

  async linkChild(
    currentUser: AuthenticatedUser,
    dto: LinkChildDto,
  ): Promise<Record<string, any>> {
    await this.assertParentOrAdmin(currentUser);

    const studentUser = await this.resolveStudentUser(dto.studentIdentifier);
    if (!studentUser) {
      throw new NotFoundException('Student account not found');
    }

    if (studentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only student accounts can be linked');
    }

    const profile = await this.parentProfileRepository.addLinkedStudent(
      currentUser.userId,
      studentUser._id.toString(),
    );

    return profile.toJSON();
  }

  async unlinkChild(currentUser: AuthenticatedUser, childUserId: string): Promise<Record<string, any>> {
    await this.assertParentOrAdmin(currentUser);

    const profile = await this.parentProfileRepository.removeLinkedStudent(currentUser.userId, childUserId);
    if (!profile) {
      throw new NotFoundException('Parent profile not found');
    }

    return profile.toJSON();
  }

  async getChildDashboard(
    currentUser: AuthenticatedUser,
    childUserId: string,
  ): Promise<Record<string, any>> {
    await this.assertParentOrAdmin(currentUser);
    await this.assertLinkedChild(currentUser.userId, childUserId);

    const childProfile = await this.studentsService.getProfileByUserId(childUserId);
    const summary = await this.progressService.getSummaryForUserId(childUserId);

    return {
      childProfile,
      summary,
    };
  }

  private async getOrCreateProfile(userId: string): Promise<Record<string, any>> {
    const existing = await this.parentProfileRepository.findByUserId(userId);
    if (existing) {
      return existing.toJSON();
    }

    const profile = await this.parentProfileRepository.upsertProfile(userId, {});
    return profile.toJSON();
  }

  private async assertParentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only parent accounts can access parent features');
    }
  }

  private async assertLinkedChild(parentUserId: string, childUserId: string): Promise<void> {
    const profile = await this.parentProfileRepository.findByUserId(parentUserId);
    if (!profile) {
      throw new NotFoundException('Parent profile not found');
    }

    const linkedStudentIds = (profile.linkedStudentIds ?? []).map((id) => id.toString());
    if (!linkedStudentIds.includes(childUserId)) {
      throw new ForbiddenException('You can only access linked child accounts');
    }
  }

  private async resolveStudentUser(identifier: string) {
    if (Types.ObjectId.isValid(identifier)) {
      const byId = await this.usersService.findById(identifier);
      if (byId) {
        return byId;
      }
    }

    return this.usersService.findByEmailOrPhone(identifier);
  }
}
