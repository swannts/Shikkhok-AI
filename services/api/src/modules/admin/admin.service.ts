import { Injectable, NotFoundException } from '@nestjs/common';
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
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { PaymentStatus } from '../subscriptions/enums/payment-status.enum';

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
    userId: string,
    dto: AdminUpdateUserStatusDto,
  ): Promise<Record<string, any>> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { status: dto.status } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.toJSON();
  }

  async createSubject(dto: AdminCreateSubjectDto): Promise<Record<string, any>> {
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
    return saved.toJSON();
  }

  async createChapter(dto: AdminCreateChapterDto): Promise<Record<string, any>> {
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
    return saved.toJSON();
  }

  async createLesson(dto: AdminCreateLessonDto): Promise<Record<string, any>> {
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
    });

    const saved = await lesson.save();
    return saved.toJSON();
  }

  async toggleLessonPublish(lessonId: string, isPublished: boolean): Promise<Record<string, any>> {
    const lesson = await this.lessonModel
      .findByIdAndUpdate(lessonId, { $set: { isPublished } }, { new: true })
      .exec();

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson.toJSON();
  }
}
