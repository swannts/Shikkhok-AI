import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { LessonRepository } from '../curriculum/repositories/lesson.repository';
import { ChapterRepository } from '../curriculum/repositories/chapter.repository';
import { SubjectRepository } from '../curriculum/repositories/subject.repository';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UpsertLessonProgressDto } from './dto/upsert-lesson-progress.dto';
import { LessonProgressRepository } from './repositories/lesson-progress.repository';
import { ProgressStatus } from './enums/progress-status.enum';

@Injectable()
export class ProgressService {
  constructor(
    private readonly lessonProgressRepository: LessonProgressRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly usersService: UsersService,
  ) {}

  async upsertMyLessonProgress(
    currentUser: AuthenticatedUser,
    lessonId: string,
    dto: UpsertLessonProgressDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const chapter = await this.chapterRepository.findById(lesson.chapterId.toString());
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const subject = await this.subjectRepository.findById(chapter.subjectId.toString());
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const normalizedStatus = dto.status ?? ProgressStatus.IN_PROGRESS;
    const progressPercent = this.resolveProgressPercent(normalizedStatus, dto.progressPercent);
    const completedAt =
      dto.completedAt || normalizedStatus === ProgressStatus.COMPLETED
        ? new Date(dto.completedAt || new Date())
        : null;
    const startedAt = dto.startedAt ? new Date(dto.startedAt) : null;
    const lastAccessedAt = dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : new Date();

    const progress = await this.lessonProgressRepository.upsertByLessonId(
      currentUser.userId,
      lessonId,
      {
        status: normalizedStatus,
        progressPercent,
        timeSpentMinutes: dto.timeSpentMinutes ?? 0,
        attemptCount: dto.attemptCount ?? 0,
        masteryScore: dto.masteryScore ?? progressPercent,
        startedAt,
        completedAt,
        lastAccessedAt,
      },
      {
        subjectId: subject._id.toString(),
        chapterId: chapter._id.toString(),
      },
    );

    return progress.toJSON();
  }

  async getMyLessonProgress(
    currentUser: AuthenticatedUser,
    lessonId: string,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);
    return this.getLessonProgressForUserId(currentUser.userId, lessonId);
  }

  async getLessonProgressForUserId(userId: string, lessonId: string): Promise<Record<string, any>> {
    const progress = await this.lessonProgressRepository.findByLessonId(userId, lessonId);
    if (!progress) {
      throw new NotFoundException('Lesson progress not found');
    }
    return progress.toJSON();
  }

  async getMySummary(currentUser: AuthenticatedUser): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);
    return this.getSummaryForUserId(currentUser.userId);
  }

  async getSummaryForUserId(userId: string): Promise<Record<string, any>> {
    const progressRecords = await this.lessonProgressRepository.findByUserId(userId);
    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(
      (record) => record.status === ProgressStatus.COMPLETED,
    ).length;
    const inProgressLessons = progressRecords.filter(
      (record) => record.status === ProgressStatus.IN_PROGRESS,
    ).length;
    const totalTimeSpentMinutes = progressRecords.reduce(
      (sum, record) => sum + (record.timeSpentMinutes ?? 0),
      0,
    );
    const averageMastery = totalLessons
      ? Math.round(
          progressRecords.reduce((sum, record) => sum + (record.masteryScore ?? 0), 0) /
            totalLessons,
        )
      : 0;

    const bySubject = new Map<
      string,
      { subjectId: string; completedLessons: number; totalLessons: number; averageMastery: number }
    >();
    for (const record of progressRecords) {
      const subjectId = record.subjectId.toString();
      const existing = bySubject.get(subjectId) ?? {
        subjectId,
        completedLessons: 0,
        totalLessons: 0,
        averageMastery: 0,
      };

      existing.totalLessons += 1;
      if (record.status === ProgressStatus.COMPLETED) {
        existing.completedLessons += 1;
      }
      existing.averageMastery += record.masteryScore ?? 0;
      bySubject.set(subjectId, existing);
    }

    const subjects = Array.from(bySubject.values()).map((entry) => ({
      ...entry,
      completionRate: entry.totalLessons
        ? Math.round((entry.completedLessons / entry.totalLessons) * 100)
        : 0,
      averageMastery: entry.totalLessons
        ? Math.round(entry.averageMastery / entry.totalLessons)
        : 0,
    }));

    return {
      totalLessons,
      completedLessons,
      inProgressLessons,
      totalTimeSpentMinutes,
      averageMastery,
      completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
      subjects,
    };
  }

  async getMySubjectProgress(
    currentUser: AuthenticatedUser,
    subjectId: string,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);
    return this.getSubjectProgressForUserId(currentUser.userId, subjectId);
  }

  async getSubjectProgressForUserId(
    userId: string,
    subjectId: string,
  ): Promise<Record<string, any>> {
    const progressRecords = await this.lessonProgressRepository.findByUserAndSubject(
      userId,
      subjectId,
    );

    if (progressRecords.length === 0) {
      return {
        subjectId,
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        completionRate: 0,
        averageMastery: 0,
        chapters: [],
      };
    }

    const chapterIds = [...new Set(progressRecords.map((record) => record.chapterId.toString()))];
    const chapters = [];

    for (const chapterId of chapterIds) {
      const chapter = await this.chapterRepository.findById(chapterId);
      if (!chapter) continue;

      const chapterProgress = progressRecords.filter(
        (record) => record.chapterId.toString() === chapterId,
      );
      const completedLessons = chapterProgress.filter(
        (record) => record.status === ProgressStatus.COMPLETED,
      ).length;
      const totalLessons = chapterProgress.length;

      chapters.push({
        chapterId,
        title: chapter.title,
        totalLessons,
        completedLessons,
        completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
        averageMastery: totalLessons
          ? Math.round(
              chapterProgress.reduce((sum, record) => sum + (record.masteryScore ?? 0), 0) /
                totalLessons,
            )
          : 0,
      });
    }

    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(
      (record) => record.status === ProgressStatus.COMPLETED,
    ).length;
    const inProgressLessons = progressRecords.filter(
      (record) => record.status === ProgressStatus.IN_PROGRESS,
    ).length;
    const averageMastery = totalLessons
      ? Math.round(
          progressRecords.reduce((sum, record) => sum + (record.masteryScore ?? 0), 0) /
            totalLessons,
        )
      : 0;

    return {
      subjectId,
      totalLessons,
      completedLessons,
      inProgressLessons,
      completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
      averageMastery,
      chapters,
    };
  }

  private async assertStudentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can access learning progress');
    }
  }

  private resolveProgressPercent(status: ProgressStatus, progressPercent?: number): number {
    if (typeof progressPercent === 'number') {
      return Math.max(0, Math.min(100, progressPercent));
    }

    switch (status) {
      case ProgressStatus.COMPLETED:
        return 100;
      case ProgressStatus.IN_PROGRESS:
        return 50;
      default:
        return 0;
    }
  }
}
