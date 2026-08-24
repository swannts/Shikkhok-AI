import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../schemas/chapter.schema';

@Injectable()
export class ChapterRepository {
  constructor(@InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>) {}

  async findPublishedBySubjectId(subjectId: string): Promise<ChapterDocument[]> {
    return this.chapterModel
      .find({
        subjectId: new Types.ObjectId(subjectId),
        isPublished: true,
      } as FilterQuery<ChapterDocument>)
      .sort({ order: 1, title: 1 })
      .exec();
  }

  async findById(id: string): Promise<ChapterDocument | null> {
    return this.chapterModel.findById(id).exec();
  }
}
