import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { LessonProgress, LessonProgressDocument } from '../schemas/lesson-progress.schema';
import { ProgressStatus } from '../enums/progress-status.enum';

@Injectable()
export class LessonProgressRepository {
  constructor(
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: Model<LessonProgressDocument>,
  ) {}

  async upsertByLessonId(
    userId: string,
    lessonId: string,
    data: Partial<Omit<LessonProgress, 'userId' | 'lessonId' | 'createdAt' | 'updatedAt'>>,
    relation: { subjectId: string; chapterId: string },
  ): Promise<LessonProgressDocument> {
    return this.lessonProgressModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          lessonId: new Types.ObjectId(lessonId),
        } as FilterQuery<LessonProgressDocument>,
        {
          $set: {
            ...data,
            subjectId: new Types.ObjectId(relation.subjectId),
            chapterId: new Types.ObjectId(relation.chapterId),
          },
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
            lessonId: new Types.ObjectId(lessonId),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async findByLessonId(userId: string, lessonId: string): Promise<LessonProgressDocument | null> {
    return this.lessonProgressModel
      .findOne({
        userId: new Types.ObjectId(userId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .exec();
  }

  async findByUserId(userId: string): Promise<LessonProgressDocument[]> {
    return this.lessonProgressModel
      .find({ userId: new Types.ObjectId(userId) } as FilterQuery<LessonProgressDocument>)
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findByUserAndSubject(userId: string, subjectId: string): Promise<LessonProgressDocument[]> {
    return this.lessonProgressModel
      .find({
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(subjectId),
      } as FilterQuery<LessonProgressDocument>)
      .sort({ updatedAt: -1 })
      .exec();
  }

  async countCompletedByChapter(userId: string, chapterId: string): Promise<number> {
    return this.lessonProgressModel.countDocuments({
      userId: new Types.ObjectId(userId),
      chapterId: new Types.ObjectId(chapterId),
      status: ProgressStatus.COMPLETED,
    }).exec();
  }
}
