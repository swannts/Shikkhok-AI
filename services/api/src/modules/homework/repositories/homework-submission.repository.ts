import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  HomeworkSubmission,
  HomeworkSubmissionDocument,
} from '../schemas/homework-submission.schema';
import { HomeworkStatus } from '../enums/homework-status.enum';

@Injectable()
export class HomeworkSubmissionRepository {
  constructor(
    @InjectModel(HomeworkSubmission.name)
    private readonly submissionModel: Model<HomeworkSubmissionDocument>,
  ) {}

  async createSubmission(data: {
    studentId: string;
    imageUrls: string[];
    prompt?: string;
    subjectId?: string;
    chapterId?: string;
    lessonId?: string;
  }): Promise<HomeworkSubmissionDocument> {
    const submission = new this.submissionModel({
      studentId: new Types.ObjectId(data.studentId),
      imageUrls: data.imageUrls,
      prompt: data.prompt?.trim() || '',
      subjectId: data.subjectId ? new Types.ObjectId(data.subjectId) : null,
      chapterId: data.chapterId ? new Types.ObjectId(data.chapterId) : null,
      lessonId: data.lessonId ? new Types.ObjectId(data.lessonId) : null,
      status: HomeworkStatus.PENDING,
    });
    return submission.save();
  }

  async findById(id: string): Promise<HomeworkSubmissionDocument | null> {
    return this.submissionModel.findById(id).exec();
  }

  async findByStudentId(
    studentId: string,
    filter: { status?: HomeworkStatus; limit?: number; offset?: number },
  ): Promise<{ data: HomeworkSubmissionDocument[]; total: number }> {
    const query: FilterQuery<HomeworkSubmissionDocument> = {
      studentId: new Types.ObjectId(studentId),
    };

    if (filter.status) {
      query.status = filter.status;
    }

    const limit = Math.max(1, Math.min(filter.limit || 20, 50));
    const offset = Math.max(0, filter.offset || 0);

    const [data, total] = await Promise.all([
      this.submissionModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).exec(),
      this.submissionModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async updateStatus(
    id: string,
    status: HomeworkStatus,
    extra?: { ocrText?: string; errorMessage?: string },
  ): Promise<HomeworkSubmissionDocument | null> {
    const update: Record<string, any> = { status };
    if (extra?.ocrText !== undefined) {
      update.ocrText = extra.ocrText;
    }
    if (extra?.errorMessage !== undefined) {
      update.errorMessage = extra.errorMessage;
    }

    return this.submissionModel.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
  }
}
