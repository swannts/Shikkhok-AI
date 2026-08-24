import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Lesson, LessonDocument } from '../schemas/lesson.schema';

@Injectable()
export class LessonRepository {
  constructor(
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
  ) {}

  async findPublishedByChapterId(chapterId: string): Promise<LessonDocument[]> {
    return this.lessonModel
      .find({
        chapterId: new Types.ObjectId(chapterId),
        isPublished: true,
      } as FilterQuery<LessonDocument>)
      .sort({ order: 1, title: 1 })
      .exec();
  }

  async findById(id: string): Promise<LessonDocument | null> {
    return this.lessonModel.findById(id).exec();
  }
}
