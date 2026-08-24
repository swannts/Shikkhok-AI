import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PracticeQuestion, PracticeQuestionDocument } from '../schemas/practice-question.schema';
import { PracticeDifficulty } from '../enums/practice-difficulty.enum';

@Injectable()
export class PracticeQuestionRepository {
  constructor(
    @InjectModel(PracticeQuestion.name)
    private readonly practiceQuestionModel: Model<PracticeQuestionDocument>,
  ) {}

  async findById(id: string): Promise<PracticeQuestionDocument | null> {
    return this.practiceQuestionModel.findById(id).exec();
  }

  async findPublishedByLesson(
    lessonId: string,
    limit = 10,
    difficulty?: PracticeDifficulty,
  ): Promise<PracticeQuestionDocument[]> {
    const filter: FilterQuery<PracticeQuestionDocument> = {
      lessonId: new Types.ObjectId(lessonId),
      isPublished: true,
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    return this.practiceQuestionModel
      .find(filter)
      .sort({ difficulty: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findManyByIds(ids: (string | Types.ObjectId)[]): Promise<PracticeQuestionDocument[]> {
    const objectIds = ids.map((id) => (typeof id === 'string' ? new Types.ObjectId(id) : id));
    return this.practiceQuestionModel.find({ _id: { $in: objectIds } }).exec();
  }
}
