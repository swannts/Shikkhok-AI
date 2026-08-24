import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { StudentsService } from '../students/students.service';
import { ProgressService } from '../progress/progress.service';
import { StudyPlanRepository } from './repositories/study-plan.repository';
import { UpsertStudyPlanDto } from './dto/upsert-study-plan.dto';
import { StudyPlanStatus } from './enums/study-plan-status.enum';

@Injectable()
export class StudyPlanService {
  constructor(
    private readonly studyPlanRepository: StudyPlanRepository,
    private readonly studentsService: StudentsService,
    private readonly progressService: ProgressService,
    private readonly usersService: UsersService,
  ) {}

  async getMyCurrentPlan(currentUser: AuthenticatedUser): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);
    const plan = await this.studyPlanRepository.findCurrentByUserId(currentUser.userId);
    if (!plan) {
      throw new NotFoundException('Study plan not found');
    }
    return plan.toJSON();
  }

  async getMyHistory(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.assertStudentOrAdmin(currentUser);
    const plans = await this.studyPlanRepository.findHistoryByUserId(currentUser.userId);
    return plans.map((plan) => plan.toJSON());
  }

  async upsertMyCurrentPlan(
    currentUser: AuthenticatedUser,
    dto: UpsertStudyPlanDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);
    const plan = await this.studyPlanRepository.upsertCurrentPlan(currentUser.userId, {
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: dto.status ?? StudyPlanStatus.ACTIVE,
      classLevel: dto.classLevel,
      medium: dto.medium,
      curriculumYear: dto.curriculumYear,
      weeklyTargetMinutes: dto.weeklyTargetMinutes ?? 0,
      dailyTargetMinutes: dto.dailyTargetMinutes ?? 0,
      focusSubjectIds: dto.focusSubjectIds ?? [],
      focusChapterIds: dto.focusChapterIds ?? [],
      focusLessonIds: dto.focusLessonIds ?? [],
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      items: (dto.items ?? []).map((item) => ({
        title: item.title.trim(),
        subjectId: item.subjectId,
        chapterId: item.chapterId,
        lessonId: item.lessonId,
        targetMinutes: item.targetMinutes,
        note: item.note?.trim(),
        completed: item.completed ?? false,
      })),
    });

    return plan.toJSON();
  }

  async generateRecommendedPlan(currentUser: AuthenticatedUser): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const studentProfile = await this.studentsService.getProfileByUserId(currentUser.userId);
    const summary = await this.progressService.getSummaryForUserId(currentUser.userId);
    const focusSubjects = [...(summary.subjects ?? [])]
      .sort((a, b) => a.averageMastery - b.averageMastery)
      .slice(0, 3);
    const weeklyTargetMinutes = this.calculateWeeklyTargetMinutes(
      studentProfile.classLevel,
      summary.averageMastery ?? 0,
    );

    const plan = await this.studyPlanRepository.upsertCurrentPlan(currentUser.userId, {
      title: 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা',
      description: 'প্রগতির ভিত্তিতে স্বয়ংক্রিয়ভাবে তৈরি পরিকল্পনা',
      status: StudyPlanStatus.ACTIVE,
      classLevel: studentProfile.classLevel,
      medium: studentProfile.medium,
      curriculumYear: studentProfile.curriculumYear,
      weeklyTargetMinutes,
      dailyTargetMinutes: Math.max(30, Math.round(weeklyTargetMinutes / 7)),
      focusSubjectIds: focusSubjects.map((subject) => subject.subjectId),
      items: this.buildPlanItems(focusSubjects, summary.averageMastery ?? 0),
      generatedFrom: {
        progressSummary: summary,
        studentProfile,
      },
    });

    return plan.toJSON();
  }

  private buildPlanItems(
    subjects: Array<{ subjectId: string; averageMastery: number }>,
    averageMastery: number,
  ): Array<{
    title: string;
    subjectId?: string;
    chapterId?: string;
    lessonId?: string;
    targetMinutes: number;
    note?: string;
    completed: boolean;
  }> {
    if (subjects.length === 0) {
      return [
        {
          title: 'পাঠ্যবই থেকে নিয়মিত অনুশীলন',
          targetMinutes: 45,
          note: 'কমপক্ষে একটি অধ্যায় এবং একটি ছোট অনুশীলন শেষ করো',
          completed: false,
        },
      ];
    }

    return subjects.map((subject, index) => ({
      title: `ফোকাস সেশন ${index + 1}`,
      subjectId: subject.subjectId,
      targetMinutes: averageMastery < 50 ? 60 : 45,
      note: subject.averageMastery < 50 ? 'ভিত্তি শক্ত করো' : 'দক্ষতা আরও মজবুত করো',
      completed: false,
    }));
  }

  private calculateWeeklyTargetMinutes(classLevel: number, averageMastery: number): number {
    const base = classLevel <= 5 ? 210 : classLevel <= 8 ? 300 : 360;
    const adjustment = averageMastery < 50 ? 90 : averageMastery < 75 ? 30 : 0;
    return base + adjustment;
  }

  private async assertStudentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can access study plans');
    }
  }
}
