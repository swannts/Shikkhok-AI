import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PracticeAttempt, PracticeAttemptDocument } from '../schemas/practice-attempt.schema';

@Injectable()
export class PracticeAttemptRepository {
  constructor(
    @InjectModel(PracticeAttempt.name)
    private readonly practiceAttemptModel: Model<PracticeAttemptDocument>,
  ) {}

  async createAttempt(data: {
    userId: string;
    questionId: string;
    questionType: string;
    isCorrect: boolean;
    score: number;
    timeSpentSeconds?: number;
    submittedAnswer?: Record<string, any> | null;
    evaluation?: Record<string, any> | null;
  }): Promise<PracticeAttemptDocument> {
    const attempt = new this.practiceAttemptModel({
      ...data,
      userId: new Types.ObjectId(data.userId),
      questionId: new Types.ObjectId(data.questionId),
    });
    return attempt.save();
  }

  async findRecentByUserId(userId: string): Promise<PracticeAttemptDocument[]> {
    return this.practiceAttemptModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }
}
