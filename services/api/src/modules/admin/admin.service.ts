import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Subject, SubjectDocument } from '../curriculum/schemas/subject.schema';
import { Chapter, ChapterDocument } from '../curriculum/schemas/chapter.schema';
import { Lesson, LessonDocument } from '../curriculum/schemas/lesson.schema';
import { ExamSession, ExamSessionDocument } from '../exams/schemas/exam-session.schema';
import {
  HomeworkSubmission,
  HomeworkSubmissionDocument,
} from '../homework/schemas/homework-submission.schema';
import {
  StudentSubscription,
  StudentSubscriptionDocument,
} from '../subscriptions/schemas/student-subscription.schema';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../subscriptions/schemas/payment-transaction.schema';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { AdminCreateSubjectDto } from './dto/admin-create-subject.dto';
import { AdminCreateChapterDto } from './dto/admin-create-chapter.dto';
import { AdminCreateLessonDto } from './dto/admin-create-lesson.dto';
import { normalizeLessonContentBlocks } from '../curriculum/types/lesson-content-block';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { PaymentStatus } from '../subscriptions/enums/payment-status.enum';
import { UserStatus } from '../users/enums/user-status.enum';

import { PaymentTransactionRepository } from '../subscriptions/repositories/payment-transaction.repository';
import { SubscriptionActivationService } from '../subscriptions/services/subscription-activation.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Subject.name) private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(ExamSession.name)
    private readonly examSessionModel: Model<ExamSessionDocument>,
    @InjectModel(HomeworkSubmission.name)
    private readonly homeworkSubmissionModel: Model<HomeworkSubmissionDocument>,
    @InjectModel(StudentSubscription.name)
    private readonly subscriptionModel: Model<StudentSubscriptionDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly transactionModel: Model<PaymentTransactionDocument>,
    private readonly transactionRepository: PaymentTransactionRepository,
    private readonly activationService: SubscriptionActivationService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getMetricsOverview(): Promise<Record<string, any>> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      roleCounts,
      activeUsers24h,
      totalExams,
      totalHomeworks,
      activeSubscriptions,
      revenueAggregation,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      this.userModel.countDocuments({ updatedAt: { $gte: yesterday } }),
      this.examSessionModel.countDocuments(),
      this.homeworkSubmissionModel.countDocuments(),
      this.subscriptionModel.countDocuments({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gte: new Date() },
      }),
      this.transactionModel.aggregate([
        { $match: { status: PaymentStatus.COMPLETED } },
        { $group: { _id: null, totalRevenueBdt: { $sum: '$amountBdt' } } },
      ]),
    ]);

    const usersByRole: Record<string, number> = {};
    for (const r of roleCounts) {
      usersByRole[r._id] = r.count;
    }

    const totalRevenueBdt = revenueAggregation[0]?.totalRevenueBdt ?? 0;

    return {
      users: {
        total: totalUsers,
        activeLast24h: activeUsers24h,
        byRole: usersByRole,
      },
      academics: {
        totalExamsTaken: totalExams,
        totalHomeworkSubmissions: totalHomeworks,
      },
      commercial: {
        activeSubscribers: activeSubscriptions,
        totalRevenueBdt,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async listUsers(query: AdminListUsersQueryDto): Promise<Record<string, any>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 20, 100));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users: users.map((u) => u.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(
    actorUserId: string,
    targetUserId: string,
    dto: AdminUpdateUserStatusDto,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    // Admin Self-Protection: Admins cannot suspend, deactivate, or delete their own account
    if (actorUserId === targetUserId && dto.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'Administrators cannot suspend, deactivate, or delete their own account (Self-protection rule)',
      );
    }

    const existingUser = await this.userModel.findById(targetUserId).exec();
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const previousStatus = existingUser.status;
    existingUser.status = dto.status;
    const updatedUser = await existingUser.save();

    // Record audit log
    await this.auditService.recordAudit({
      actorUserId,
      action: 'UPDATE_USER_STATUS',
      resourceType: 'USER',
      resourceId: targetUserId,
      before: { status: previousStatus },
      after: { status: dto.status },
      reason: dto.reason ?? 'Status updated by administrator',
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return updatedUser.toJSON();
  }

  async createSubject(
    actorUserId: string,
    dto: AdminCreateSubjectDto,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    const subject = new this.subjectModel({
      classLevel: dto.classLevel,
      medium: dto.medium,
      curriculumYear: dto.curriculumYear,
      name: dto.name.trim(),
      slug: dto.slug.toLowerCase().trim(),
      description: dto.description?.trim(),
      order: dto.order ?? 0,
      isPublished: dto.isPublished ?? true,
    });

    const saved = await subject.save();

    await this.auditService.recordAudit({
      actorUserId,
      action: 'CREATE_SUBJECT',
      resourceType: 'CURRICULUM_SUBJECT',
      resourceId: saved._id.toString(),
      after: saved.toJSON(),
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return saved.toJSON();
  }

  async createChapter(
    actorUserId: string,
    dto: AdminCreateChapterDto,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    const chapter = new this.chapterModel({
      subjectId: new Types.ObjectId(dto.subjectId),
      title: dto.title.trim(),
      slug: dto.slug.toLowerCase().trim(),
      summary: dto.summary?.trim(),
      order: dto.order ?? 0,
      estimatedMinutes: dto.estimatedMinutes ?? null,
      isPublished: dto.isPublished ?? true,
    });

    const saved = await chapter.save();

    await this.auditService.recordAudit({
      actorUserId,
      action: 'CREATE_CHAPTER',
      resourceType: 'CURRICULUM_CHAPTER',
      resourceId: saved._id.toString(),
      after: saved.toJSON(),
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return saved.toJSON();
  }

  async createLesson(
    actorUserId: string,
    dto: AdminCreateLessonDto,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    const lesson = new this.lessonModel({
      chapterId: new Types.ObjectId(dto.chapterId),
      title: dto.title.trim(),
      slug: dto.slug.toLowerCase().trim(),
      summary: dto.summary?.trim(),
      textbookReference: dto.textbookReference?.trim(),
      order: dto.order ?? 0,
      pageStart: dto.pageStart ?? null,
      pageEnd: dto.pageEnd ?? null,
      isPublished: dto.isPublished ?? true,
      contentVersion: dto.contentVersion ?? 1,
      contentBlocks: normalizeLessonContentBlocks(
        dto.contentBlocks as unknown as Parameters<typeof normalizeLessonContentBlocks>[0],
      ).map((block) => ({
        ...block,
      })),
    });

    const saved = await lesson.save();

    await this.auditService.recordAudit({
      actorUserId,
      action: 'CREATE_LESSON',
      resourceType: 'CURRICULUM_LESSON',
      resourceId: saved._id.toString(),
      after: saved.toJSON(),
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return saved.toJSON();
  }

  async toggleLessonPublish(
    actorUserId: string,
    lessonId: string,
    isPublished: boolean,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(lessonId, { $set: { isPublished } }, { new: true })
      .exec();

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.auditService.recordAudit({
      actorUserId,
      action: 'TOGGLE_LESSON_PUBLISH',
      resourceType: 'CURRICULUM_LESSON',
      resourceId: lessonId,
      after: { isPublished },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return lesson.toJSON();
  }

  async listPendingPayments(limit = 20, page = 1): Promise<Record<string, any>> {
    const skip = (Math.max(1, page) - 1) * limit;
    const transactions = await this.transactionRepository.findPendingManualPayments(limit, skip);
    return {
      transactions: transactions.map((t) => t.toJSON()),
      limit,
      page,
    };
  }

  async approvePayment(
    adminUserId: string,
    transactionId: string,
    verificationNote?: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    const result = await this.activationService.activateFromPayment(
      transactionId,
      `admin:${adminUserId}`,
      undefined,
      verificationNote || 'Approved manually by administrator',
    );

    await this.auditService.recordAudit({
      actorUserId: adminUserId,
      action: 'APPROVE_PAYMENT',
      resourceType: 'PAYMENT_TRANSACTION',
      resourceId: transactionId,
      after: { status: PaymentStatus.COMPLETED, note: verificationNote },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      message: 'Payment approved and subscription activated successfully',
      isAlreadyActive: result.isAlreadyActive,
      subscription: result.subscription.toJSON(),
      transaction: result.transaction.toJSON(),
    };
  }

  async rejectPayment(
    adminUserId: string,
    transactionId: string,
    rejectionReason: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    const rejectedTxn = await this.activationService.rejectPayment(
      transactionId,
      `admin:${adminUserId}`,
      rejectionReason,
    );

    await this.auditService.recordAudit({
      actorUserId: adminUserId,
      action: 'REJECT_PAYMENT',
      resourceType: 'PAYMENT_TRANSACTION',
      resourceId: transactionId,
      after: { status: PaymentStatus.FAILED, reason: rejectionReason },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      message: 'Payment rejected successfully',
      transaction: rejectedTxn.toJSON(),
    };
  }
}
