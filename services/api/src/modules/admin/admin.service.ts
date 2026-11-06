import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { Textbook, TextbookDocument } from '../textbooks/schemas/textbook.schema';
import { RedisService } from '../../core/redis/redis.service';
import { RabbitMqService } from '../../core/queue/rabbitmq.service';
import { AiGatewayService } from '../ai-gateway/services/ai-gateway.service';
import { PaymentMethod } from '../subscriptions/enums/payment-method.enum';
import { PaymentStateMachineService } from '../subscriptions/services/payment-state-machine.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';

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
import { ContentWorkflowStatus } from '../curriculum/enums/content-workflow-status.enum';
import { LessonContentBlockType } from '../curriculum/types/lesson-content-block';
import { AdminUploadTextbookDto } from './dto/admin-upload-textbook.dto';
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

interface UploadedPdfFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

import { PaymentTransactionRepository } from '../subscriptions/repositories/payment-transaction.repository';
import { SubscriptionActivationService } from '../subscriptions/services/subscription-activation.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

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
    @InjectModel(Textbook.name) private textbookModel: Model<TextbookDocument>,
    private readonly rabbitMq: RabbitMqService,
    @Optional() private readonly redisService?: RedisService,
    @Optional() private readonly aiGatewayService?: AiGatewayService,
    @Optional() private readonly authService?: AuthService,
    @Optional() private readonly paymentStateMachine?: PaymentStateMachineService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async updateCurriculumIndexingProgress(
    bookId: string,
    progress: {
      status: 'processing' | 'indexed' | 'failed' | 'partially_failed';
      indexedChunkCount?: number;
      failedChunkCount?: number;
      error?: string;
    },
  ): Promise<void> {
    const update: Record<string, unknown> = {
      indexingStatus: progress.status,
      indexedChunkCount: Math.max(0, progress.indexedChunkCount ?? 0),
      failedChunkCount: Math.max(0, progress.failedChunkCount ?? 0),
    };
    if (progress.status === 'processing') update.indexingStartedAt = new Date();
    if (progress.status === 'indexed') update.lastIndexedAt = new Date();
    if (progress.error) update.lastIndexError = progress.error.slice(0, 1000);
    if (progress.status !== 'failed' && progress.status !== 'partially_failed') {
      update.lastIndexError = null;
    }
    await this.textbookModel.updateOne({ _id: bookId }, { $set: update }).exec();
  }

  async persistExtractedStructure(
    bookId: string,
    sections: Array<{
      chapter_title: string;
      lesson_title: string;
      page_start: number;
      page_end: number;
      text: string;
    }>,
  ): Promise<{ ok: true; chapters: number; lessons: number }> {
    const book = await this.textbookModel.findById(bookId).exec();
    if (!book || !sections.length) return { ok: true, chapters: 0, lessons: 0 };
    const grouped = new Map<string, typeof sections>();
    for (const section of sections) {
      const current = grouped.get(section.chapter_title) ?? [];
      current.push(section);
      grouped.set(section.chapter_title, current);
    }
    let lessonCount = 0;
    let chapterOrder = 0;
    for (const [chapterTitle, chapterSections] of grouped) {
      const chapter = await this.chapterModel
        .findOneAndUpdate(
          { subjectId: book.subjectId, slug: this.slugify(chapterTitle) },
          { $set: { title: chapterTitle, order: chapterOrder++, isPublished: true } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )
        .exec();
      let lessonOrder = 0;
      for (const section of chapterSections) {
        const text = section.text.trim();
        if (!text) continue;
        const lessonSlug = this.slugify(section.lesson_title);
        const lessonFilter = { chapterId: chapter._id, slug: lessonSlug };
        const existingLesson = await this.lessonModel.findOne(lessonFilter).exec();
        const now = new Date();
        const workflowStatus = ContentWorkflowStatus.DRAFT;
        const lessonUpdate: Record<string, any> = {
          $set: {
            title: section.lesson_title,
            order: lessonOrder++,
            pageStart: section.page_start,
            pageEnd: section.page_end,
            isPublished: false,
            workflowStatus,
            publishedAt: null,
            publishedBy: null,
            approvedBy: null,
            reviewedBy: null,
            reviewComments:
              'Updated from source PDF. Teacher review is required before publishing.',
            contentBlocks: [
              {
                id: `ocr-${bookId}-${section.page_start}`,
                type: LessonContentBlockType.PARAGRAPH,
                order: 0,
                text,
              },
            ],
          },
          $setOnInsert: {
            workflowHistory: [
              {
                fromStatus: null,
                toStatus: workflowStatus,
                actorUserId: null,
                reviewComments: 'Generated from source PDF; review required.',
                changedAt: now,
              },
            ],
          },
        };
        if (
          existingLesson &&
          (existingLesson.workflowStatus !== workflowStatus || existingLesson.isPublished)
        ) {
          lessonUpdate.$push = {
            workflowHistory: {
              fromStatus: existingLesson.workflowStatus ?? ContentWorkflowStatus.DRAFT,
              toStatus: workflowStatus,
              actorUserId: null,
              reviewComments: 'Source PDF was reindexed; teacher review is required again.',
              changedAt: now,
            },
          };
        }
        await this.lessonModel
          .findOneAndUpdate(lessonFilter, lessonUpdate, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          })
          .exec();
        lessonCount++;
      }
    }
    // Structure extraction may arrive in multiple idempotent batches. Count
    // the persisted lessons for this subject instead of replacing the
    // textbook total with only the current batch size.
    const subjectChapters = await this.chapterModel
      .find({ subjectId: book.subjectId })
      .select({ _id: 1 })
      .lean()
      .exec();
    const persistedLessonCount = await this.lessonModel
      .countDocuments({ chapterId: { $in: subjectChapters.map((chapter) => chapter._id) } })
      .exec();
    const persistedChapterCount = await this.chapterModel
      .countDocuments({ subjectId: book.subjectId })
      .exec();
    await this.textbookModel
      .updateOne(
        { _id: bookId },
        { $set: { totalChapters: persistedChapterCount, totalLessons: persistedLessonCount } },
      )
      .exec();
    return { ok: true, chapters: persistedChapterCount, lessons: persistedLessonCount };
  }

  private slugify(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '') || 'section'
    );
  }

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
      // New material must pass review and approval before it can be published.
      isPublished: false,
      workflowStatus: ContentWorkflowStatus.DRAFT,
      workflowHistory: [
        {
          fromStatus: null,
          toStatus: ContentWorkflowStatus.DRAFT,
          actorUserId: new Types.ObjectId(actorUserId),
          changedAt: new Date(),
        },
      ],
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
    const existing = await this.lessonModel.findById(lessonId).exec();
    if (!existing) throw new NotFoundException('Lesson not found');
    if (
      isPublished &&
      existing.workflowStatus !== ContentWorkflowStatus.APPROVED &&
      existing.workflowStatus !== ContentWorkflowStatus.PUBLISHED
    ) {
      throw new BadRequestException('A lesson must be approved before it can be published');
    }
    const nextStatus = isPublished ? ContentWorkflowStatus.PUBLISHED : ContentWorkflowStatus.DRAFT;
    const lesson = existing;
    const fromStatus = lesson.workflowStatus;
    lesson.isPublished = isPublished;
    lesson.workflowStatus = nextStatus;
    if (isPublished) {
      lesson.publishedBy = new Types.ObjectId(actorUserId);
      lesson.publishedAt = new Date();
    } else {
      lesson.publishedBy = undefined;
      lesson.publishedAt = undefined;
    }
    lesson.workflowHistory = lesson.workflowHistory ?? [];
    lesson.workflowHistory.push({
      fromStatus,
      toStatus: nextStatus,
      actorUserId: new Types.ObjectId(actorUserId),
      changedAt: new Date(),
    } as any);
    await lesson.save();

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

  async transitionLessonWorkflow(
    actorUserId: string,
    lessonId: string,
    status: ContentWorkflowStatus,
    reviewComments?: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<Record<string, any>> {
    if (!Object.values(ContentWorkflowStatus).includes(status)) {
      throw new BadRequestException(`Unknown lesson workflow status: ${String(status)}`);
    }
    if (status === ContentWorkflowStatus.PUBLISHED) {
      throw new BadRequestException('Publish an approved lesson through the publish operation');
    }
    const lesson = await this.lessonModel.findById(lessonId).exec();
    if (!lesson) throw new NotFoundException('Lesson not found');

    const current =
      lesson.workflowStatus ??
      (lesson.isPublished ? ContentWorkflowStatus.PUBLISHED : ContentWorkflowStatus.DRAFT);
    const allowed: Record<ContentWorkflowStatus, ContentWorkflowStatus[]> = {
      [ContentWorkflowStatus.DRAFT]: [
        ContentWorkflowStatus.IN_REVIEW,
        ContentWorkflowStatus.ARCHIVED,
      ],
      [ContentWorkflowStatus.IN_REVIEW]: [
        ContentWorkflowStatus.APPROVED,
        ContentWorkflowStatus.REJECTED,
      ],
      [ContentWorkflowStatus.APPROVED]: [ContentWorkflowStatus.REJECTED],
      [ContentWorkflowStatus.PUBLISHED]: [
        ContentWorkflowStatus.ARCHIVED,
        ContentWorkflowStatus.DRAFT,
      ],
      [ContentWorkflowStatus.REJECTED]: [
        ContentWorkflowStatus.DRAFT,
        ContentWorkflowStatus.IN_REVIEW,
      ],
      [ContentWorkflowStatus.ARCHIVED]: [ContentWorkflowStatus.DRAFT],
    };
    if (current !== status && !allowed[current].includes(status)) {
      throw new BadRequestException(`Invalid lesson workflow transition: ${current} -> ${status}`);
    }

    lesson.workflowStatus = status;
    lesson.isPublished = false;
    lesson.reviewComments = reviewComments?.trim() || lesson.reviewComments;
    if (status === ContentWorkflowStatus.IN_REVIEW || status === ContentWorkflowStatus.REJECTED) {
      lesson.reviewedBy = new Types.ObjectId(actorUserId);
    }
    if (status === ContentWorkflowStatus.APPROVED)
      lesson.approvedBy = new Types.ObjectId(actorUserId);
    lesson.workflowHistory = lesson.workflowHistory ?? [];
    if (current !== status) {
      lesson.workflowHistory.push({
        fromStatus: current,
        toStatus: status,
        actorUserId: new Types.ObjectId(actorUserId),
        reviewComments: reviewComments?.trim() || null,
        changedAt: new Date(),
      } as any);
    }
    const saved = await lesson.save();
    await this.auditService.recordAudit({
      actorUserId,
      action: 'TRANSITION_LESSON_WORKFLOW',
      resourceType: 'CURRICULUM_LESSON',
      resourceId: lessonId,
      after: { status, reviewComments },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });
    return saved.toJSON();
  }

  async getCurriculumCompleteness(): Promise<Record<string, any>> {
    const [subjects, chapters, lessons] = await Promise.all([
      this.subjectModel.find().lean().exec(),
      this.chapterModel.find().lean().exec(),
      this.lessonModel.find().lean().exec(),
    ]);
    const chaptersBySubject = new Map<string, number>();
    for (const chapter of chapters) {
      const key = chapter.subjectId.toString();
      chaptersBySubject.set(key, (chaptersBySubject.get(key) ?? 0) + 1);
    }
    const lessonsByChapter = new Map<string, any[]>();
    for (const lesson of lessons) {
      const key = lesson.chapterId.toString();
      lessonsByChapter.set(key, [...(lessonsByChapter.get(key) ?? []), lesson]);
    }
    const rows = subjects.map((subject) => {
      const subjectChapters = chapters.filter(
        (chapter) => chapter.subjectId.toString() === subject._id.toString(),
      );
      const subjectLessons = subjectChapters.flatMap(
        (chapter) => lessonsByChapter.get(chapter._id.toString()) ?? [],
      );
      const published = subjectLessons.filter(
        (lesson) =>
          lesson.workflowStatus === ContentWorkflowStatus.PUBLISHED ||
          (lesson.workflowStatus == null && lesson.isPublished),
      );
      const structured = subjectLessons.filter(
        (lesson) => Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.length > 0,
      );
      return {
        subjectId: subject._id,
        subject: subject.name,
        classLevel: subject.classLevel,
        medium: subject.medium,
        curriculumYear: subject.curriculumYear,
        chapters: subjectChapters.length,
        lessons: subjectLessons.length,
        publishedLessons: published.length,
        structuredLessons: structured.length,
        completenessPercent: subjectLessons.length
          ? Math.round((published.length / subjectLessons.length) * 100)
          : 0,
        missingContent: subjectLessons
          .filter((lesson) => !lesson.contentBlocks?.length)
          .map((lesson) => lesson._id),
      };
    });
    return { rows, generatedAt: new Date().toISOString() };
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

  // ──────────────────────────────────────────────
  // CURRICULUM MANAGEMENT
  // ──────────────────────────────────────────────

  async getAllTextbooksIndexingStatus(page = 1, limit = 50) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [books, total] = await Promise.all([
      this.textbookModel
        .find()
        .select(
          'title titleBn subjectId classLevel medium curriculumYear curriculumVersion edition indexingStatus indexedChunkCount chunkCount failedChunkCount indexingStartedAt lastIndexedAt lastIndexError',
        )
        .populate('subjectId', 'name nameBn')
        .sort({ updatedAt: -1, _id: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .exec(),
      this.textbookModel.countDocuments(),
    ]);

    const items = books.map((b: any) => ({
      bookId: b._id,
      title: b.title,
      titleBn: b.titleBn,
      classLevel: b.classLevel,
      medium: b.medium,
      curriculumYear: b.curriculumYear,
      curriculumVersion: b.curriculumVersion ?? null,
      edition: b.edition,
      subject: b.subjectId ? b.subjectId.name : null,
      subjectBn: b.subjectId ? b.subjectId.nameBn : null,
      indexingStatus: b.indexingStatus || 'draft',
      indexedChunkCount: b.indexedChunkCount || b.chunkCount || 0,
      failedChunkCount: b.failedChunkCount || 0,
      indexingStartedAt: b.indexingStartedAt,
      lastIndexedAt: b.lastIndexedAt,
      lastError: b.lastIndexError ? b.lastIndexError.split('\n')[0] : null,
    }));
    return {
      items,
      pageInfo: {
        page: safePage,
        limit: safeLimit,
        total,
        hasNextPage: safePage * safeLimit < total,
      },
    };
  }

  async queueTextbookForReindex(bookId: string) {
    const book: any = await this.textbookModel.findById(bookId).exec();
    if (!book) {
      throw new NotFoundException('Textbook not found');
    }

    try {
      book.indexingStatus = 'queued';
      book.indexingStartedAt = null;
      book.indexedChunkCount = 0;
      book.failedChunkCount = 0;
      book.lastIndexError = null;
      await book.save();

      await this.rabbitMq.publish(
        'curriculum',
        'process-curriculum-indexing',
        { bookId: book._id.toString() },
        `reindex-book-${book._id.toString()}`,
      );

      return {
        message: 'Textbook successfully queued for background re-indexing',
        status: 'queued',
      };
    } catch (e: any) {
      this.logger.error(`Failed to enqueue textbook reindexing: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Failed to communicate with background worker queue');
    }
  }

  async uploadTextbook(
    actorUserId: string,
    file: UploadedPdfFile | undefined,
    dto: AdminUploadTextbookDto,
  ): Promise<{ bookId: string; status: string }> {
    if (
      !file ||
      file.mimetype !== 'application/pdf' ||
      file.size > 50 * 1024 * 1024 ||
      file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      throw new BadRequestException('A PDF file is required');
    }

    const activeVersion = this.configService?.get<string>('curriculum.version');
    const activeYear = this.configService?.get<number>('curriculum.year');
    const curriculumVersion = dto.curriculumVersion?.trim() || activeVersion;
    if (!curriculumVersion) {
      throw new BadRequestException('Curriculum version must be supplied or configured');
    }
    if (!dto.curriculumVersion && activeYear && activeYear !== dto.curriculumYear) {
      throw new BadRequestException(
        'The upload year differs from the configured active curriculum year; specify its version explicitly',
      );
    }

    const subject = await this.subjectModel
      .findOne({
        _id: dto.subjectId,
        classLevel: dto.classLevel,
        medium: dto.medium,
        curriculumYear: dto.curriculumYear,
      })
      .exec();
    if (!subject) {
      throw new BadRequestException('Subject does not match the supplied curriculum scope');
    }

    const checksumSha256 = createHash('sha256').update(file.buffer).digest('hex');
    const uploadDir = process.env.CURRICULUM_UPLOAD_DIR || '/app/uploads/curriculum';
    await mkdir(uploadDir, { recursive: true });
    const storagePath = join(uploadDir, `${checksumSha256}.pdf`);
    await writeFile(storagePath, file.buffer, { flag: 'wx' }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EEXIST') throw error;
      },
    );

    const book = await this.textbookModel
      .findOneAndUpdate(
        {
          checksumSha256,
          subjectId: subject._id,
          curriculumVersion,
        },
        {
          $set: {
            title: dto.title,
            titleBn: dto.titleBn,
            subjectId: subject._id,
            classLevel: dto.classLevel,
            medium: dto.medium,
            curriculumYear: dto.curriculumYear,
            curriculumVersion,
            edition: dto.edition?.trim() || null,
            fileSizeBytes: file.size,
            pdfStoragePath: storagePath,
            indexingStatus: 'queued',
            lastIndexError: null,
          },
          $setOnInsert: { isPublished: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    await this.rabbitMq.publish(
      'curriculum',
      'process-curriculum-indexing',
      {
        bookId: book._id.toString(),
        filePath: storagePath,
        sourceBook: dto.titleBn || dto.title,
        subjectTitle: dto.titleBn || dto.title,
        subjectId: subject._id.toString(),
        classLevel: dto.classLevel,
        medium: dto.medium,
        curriculumVersion,
        academicYear: dto.curriculumYear,
      },
      `index-book-${book._id.toString()}`,
    );
    await this.auditService.recordAudit({
      actorUserId,
      action: 'UPLOAD_CURRICULUM_BOOK',
      resourceType: 'TEXTBOOK',
      resourceId: book._id.toString(),
      metadata: { checksumSha256, fileSizeBytes: file.size },
    });
    return { bookId: book._id.toString(), status: 'queued' };
  }

  async getPlatformHealthOverview(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      mongodb: { status: 'up' | 'down'; latencyMs: number };
      redis: { status: 'up' | 'down'; latencyMs: number };
      aiService: { status: 'up' | 'down' | 'disabled'; healthy: boolean };
      vectorStore: { status: 'up' | 'down' | 'unknown'; totalVectors?: number };
      queues: { status: 'up' | 'down'; totalWaiting: number; totalFailed: number };
    };
    timestamp: string;
  }> {
    let mongoStatus: 'up' | 'down' = 'down';
    let mongoLatency = -1;
    try {
      const start = Date.now();
      if (this.userModel?.db?.db) {
        await this.userModel.db.db.admin().ping();
        mongoLatency = Date.now() - start;
        mongoStatus = 'up';
      }
    } catch {
      mongoStatus = 'down';
    }

    let redisStatus: 'up' | 'down' = 'down';
    let redisLatency = -1;
    if (this.redisService) {
      try {
        const start = Date.now();
        const pong = await this.redisService.getClient().ping();
        if (pong === 'PONG') {
          redisLatency = Date.now() - start;
          redisStatus = 'up';
        }
      } catch {
        redisStatus = 'down';
      }
    }

    let aiStatus: 'up' | 'down' | 'disabled' = 'disabled';
    let aiHealthy = false;
    let vectorStoreStatus: 'up' | 'down' | 'unknown' = 'unknown';
    let totalVectors: number | undefined;

    if (this.aiGatewayService) {
      const enabled = this.aiGatewayService.isServiceEnabled();
      if (!enabled) {
        aiStatus = 'disabled';
      } else {
        try {
          aiHealthy = await this.aiGatewayService.healthCheck();
          aiStatus = aiHealthy ? 'up' : 'down';
          const stats = await this.aiGatewayService.getIngestionStats();
          if (stats) {
            vectorStoreStatus = 'up';
            totalVectors = stats.total_points ?? stats.vector_count ?? stats.points_count;
          }
        } catch {
          aiStatus = 'down';
          vectorStoreStatus = 'down';
        }
      }
    }

    let totalWaiting = 0;
    let totalFailed = 0;
    let queueStatus: 'up' | 'down' = 'up';
    for (const name of ['curriculum', 'notifications', 'analytics', 'homework']) {
      try {
        const counts = await this.rabbitMq.stats(name);
        totalWaiting += counts.waiting;
        totalFailed += counts.failed;
      } catch {
        queueStatus = 'down';
      }
    }

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (mongoStatus === 'down' || redisStatus === 'down') {
      overall = 'unhealthy';
    } else if (aiStatus !== 'up' || queueStatus === 'down' || totalFailed > 50) {
      overall = 'degraded';
    }

    return {
      status: overall,
      services: {
        mongodb: { status: mongoStatus, latencyMs: mongoLatency },
        redis: { status: redisStatus, latencyMs: redisLatency },
        aiService: { status: aiStatus, healthy: aiHealthy },
        vectorStore: { status: vectorStoreStatus, totalVectors },
        queues: { status: queueStatus, totalWaiting, totalFailed },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getQueueMetricsOverview(): Promise<{
    queues: Record<
      string,
      {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
      }
    >;
    deadLetterQueues: Record<string, { count: number }>;
    totalBacklog: number;
    timestamp: string;
  }> {
    const resultQueues: Record<string, any> = {};
    let totalBacklog = 0;
    for (const name of ['curriculum', 'notifications', 'analytics', 'homework']) {
      try {
        const counts = await this.rabbitMq.stats(name);
        resultQueues[name] = { waiting: counts.waiting, consumers: counts.consumers, failed: counts.failed };
        totalBacklog += counts.waiting;
      } catch (err: unknown) {
        resultQueues[name] = {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
          error: err instanceof Error ? err.message : 'Queue metrics unavailable',
        };
      }
    }

    const deadLetterQueues: Record<string, { count: number }> = {};
    for (const name of ['curriculum', 'notifications', 'analytics', 'homework']) {
      try {
        const counts = await this.rabbitMq.stats(name);
        deadLetterQueues[`${name}-dlq`] = { count: counts.failed };
      } catch {
        deadLetterQueues[`${name}-dlq`] = { count: 0 };
      }
    }

    return {
      queues: resultQueues,
      deadLetterQueues,
      totalBacklog,
      timestamp: new Date().toISOString(),
    };
  }

  async getFailedQueueJobs(queueName: string, limit = 20) {
    const queue = queueName.replace(/-dlq$/, '');
    if (!['curriculum', 'notifications', 'analytics', 'homework'].includes(queue)) {
      throw new NotFoundException(`Queue "${queueName}" not found or not configured`);
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.rabbitMq.listFailed(queue, safeLimit);
  }

  async retryFailedQueueJobs(queueName: string, limit = 100) {
    if (!['curriculum', 'notifications', 'analytics', 'homework'].includes(queueName)) {
      throw new NotFoundException(`Queue "${queueName}" not found or not retryable`);
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const retriedCount = await this.rabbitMq.retryFailed(queueName, safeLimit);
    const failedJobs = await this.rabbitMq.listFailed(queueName, safeLimit);

    return {
      queue: queueName,
      retriedCount,
      totalFound: retriedCount + failedJobs.length,
      message: `${retriedCount} failed jobs queued for retry.`,
      timestamp: new Date().toISOString(),
    };
  }

  async revokeUserSessions(
    actorUserId: string,
    targetUserId: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string; userId: string; revokedSessions: number }> {
    const user = await this.userModel.findById(targetUserId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeCount = this.authService
      ? await this.authService.getActiveSessionCount(targetUserId)
      : 0;
    if (this.authService) {
      await this.authService.logoutAll(targetUserId);
    }

    await this.auditService.recordAudit({
      actorUserId,
      action: 'REVOKE_USER_SESSIONS',
      resourceType: 'USER',
      resourceId: targetUserId,
      metadata: { targetUserRole: user.role, revokedCount: activeCount },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      message: 'All active sessions for user successfully revoked',
      userId: targetUserId,
      revokedSessions: activeCount,
    };
  }

  async refundPayment(
    actorUserId: string,
    transactionId: string,
    refundReason?: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string; transaction: any }> {
    const transaction = await this.transactionModel.findOne({ transactionId }).exec();
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (this.paymentStateMachine) {
      this.paymentStateMachine.validateTransition(
        transaction.status,
        PaymentStatus.REFUNDED,
        transactionId,
      );
    }

    transaction.status = PaymentStatus.REFUNDED;
    transaction.refundedAt = new Date();
    transaction.refundedBy = actorUserId;
    transaction.refundReason = refundReason || 'Refunded by administrator';
    const savedTransaction = await transaction.save();

    // Revert active subscription if tied to this user/plan
    await this.subscriptionModel
      .updateMany(
        {
          userId: transaction.userId,
          paymentTransactionId: transaction.transactionId,
          status: SubscriptionStatus.ACTIVE,
        },
        {
          $set: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        },
      )
      .exec();

    await this.auditService.recordAudit({
      actorUserId,
      action: 'REFUND_PAYMENT',
      resourceType: 'PAYMENT_TRANSACTION',
      resourceId: transactionId,
      metadata: {
        userId: transaction.userId.toString(),
        amountBdt: transaction.amountBdt,
        paymentMethod: transaction.paymentMethod,
        refundReason,
      },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      message: `Transaction ${transactionId} refunded successfully`,
      transaction: savedTransaction.toJSON(),
    };
  }

  async getPaymentReconciliation(query: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: PaymentMethod;
  }): Promise<Record<string, unknown>> {
    const filter: Record<string, any> = {};
    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const [transactions, statusAggregation, methodAggregation] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).limit(100).lean().exec(),
      this.transactionModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmountBdt: { $sum: '$amountBdt' },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmountBdt: { $sum: '$amountBdt' },
          },
        },
      ]),
    ]);

    const byStatus: Record<string, { count: number; totalAmountBdt: number }> = {};
    let totalGrossRevenue = 0;
    let totalRefundedAmount = 0;

    for (const item of statusAggregation) {
      byStatus[item._id] = { count: item.count, totalAmountBdt: item.totalAmountBdt };
      if (item._id === PaymentStatus.COMPLETED) {
        totalGrossRevenue += item.totalAmountBdt;
      }
      if (item._id === PaymentStatus.REFUNDED) {
        totalRefundedAmount += item.totalAmountBdt;
      }
    }

    const byMethod: Record<string, { count: number; totalAmountBdt: number }> = {};
    for (const item of methodAggregation) {
      byMethod[item._id] = { count: item.count, totalAmountBdt: item.totalAmountBdt };
    }

    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
    const discrepancies: any[] = [];

    for (const tx of transactions) {
      if (tx.status === PaymentStatus.PENDING_VERIFICATION && tx.createdAt < twoDaysAgo) {
        discrepancies.push({
          transactionId: tx.transactionId,
          type: 'STALE_PENDING_VERIFICATION',
          message: 'Manual payment pending verification for more than 48 hours',
          amountBdt: tx.amountBdt,
          createdAt: tx.createdAt,
        });
      }
      if (
        tx.paidAt &&
        tx.status !== PaymentStatus.COMPLETED &&
        tx.status !== PaymentStatus.REFUNDED
      ) {
        discrepancies.push({
          transactionId: tx.transactionId,
          type: 'PAID_BUT_UNCOMPLETED',
          message: `Transaction has paidAt timestamp (${tx.paidAt}) but status is ${tx.status}`,
          amountBdt: tx.amountBdt,
          createdAt: tx.createdAt,
        });
      }
    }

    const countFor = (...statuses: PaymentStatus[]) =>
      statuses.reduce((sum, status) => sum + (byStatus[status]?.count ?? 0), 0);
    const amountFor = (...statuses: PaymentStatus[]) =>
      statuses.reduce((sum, status) => sum + (byStatus[status]?.totalAmountBdt ?? 0), 0);
    const refundedTransactions = transactions.filter(
      (transaction) => transaction.status === PaymentStatus.REFUNDED,
    );
    const settledTransactions = transactions.filter(
      (transaction) => transaction.status === PaymentStatus.COMPLETED,
    );

    return {
      summary: {
        totalTransactions: Object.values(byStatus).reduce((sum, item) => sum + item.count, 0),
        settledCount: countFor(PaymentStatus.COMPLETED),
        settledAmountBdt: amountFor(PaymentStatus.COMPLETED),
        pendingCount: countFor(
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
          PaymentStatus.PENDING_VERIFICATION,
        ),
        pendingAmountBdt: amountFor(
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
          PaymentStatus.PENDING_VERIFICATION,
        ),
        refundedCount: countFor(PaymentStatus.REFUNDED),
        refundedAmountBdt: amountFor(PaymentStatus.REFUNDED),
        failedCount: countFor(PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.EXPIRED),
      },
      recentSettlements: settledTransactions.slice(0, 20).map((transaction) => ({
        ...transaction,
        _id: String(transaction._id),
        userId: String(transaction.userId),
      })),
      recentRefunds: refundedTransactions.slice(0, 20).map((transaction) => ({
        ...transaction,
        _id: String(transaction._id),
        userId: String(transaction.userId),
      })),
      totalGrossRevenue,
      totalRefundedAmount,
      netRevenue: totalGrossRevenue - totalRefundedAmount,
      byStatus,
      byMethod,
      discrepancyCount: discrepancies.length,
      discrepancies,
      recentTransactions: transactions.slice(0, 20).map((transaction) => ({
        ...transaction,
        _id: String(transaction._id),
        userId: String(transaction.userId),
      })),
      timestamp: new Date().toISOString(),
    };
  }
}
