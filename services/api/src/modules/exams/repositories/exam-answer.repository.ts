import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamAnswer, ExamAnswerDocument } from '../schemas/exam-answer.schema';

@Injectable()
export class ExamAnswerRepository {
  constructor(
    @InjectModel(ExamAnswer.name)
    private readonly answerModel: Model<ExamAnswerDocument>,
  ) {}

  async saveAnswer(data: {
    sessionId: string;
    questionId: string;
    submittedAnswer: any;
  }): Promise<ExamAnswerDocument> {
    const sessionObjectId = new Types.ObjectId(data.sessionId);
    const questionObjectId = new Types.ObjectId(data.questionId);

    return this.answerModel
      .findOneAndUpdate(
        { sessionId: sessionObjectId, questionId: questionObjectId },
        {
          $set: {
            sessionId: sessionObjectId,
            questionId: questionObjectId,
            submittedAnswer: data.submittedAnswer,
            answeredAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async setFlag(
    sessionId: string,
    questionId: string,
    flagged: boolean,
  ): Promise<ExamAnswerDocument | null> {
    const sessionObjectId = new Types.ObjectId(sessionId);
    const questionObjectId = new Types.ObjectId(questionId);

    return this.answerModel
      .findOneAndUpdate(
        { sessionId: sessionObjectId, questionId: questionObjectId },
        {
          $set: {
            flagged,
          },
          $setOnInsert: {
            sessionId: sessionObjectId,
            questionId: questionObjectId,
            submittedAnswer: null,
            answeredAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findBySessionId(sessionId: string): Promise<ExamAnswerDocument[]> {
    return this.answerModel.find({ sessionId: new Types.ObjectId(sessionId) }).exec();
  }

  async gradeAnswer(
    sessionId: string,
    questionId: string,
    isCorrect: boolean,
    marksAwarded: number,
  ): Promise<ExamAnswerDocument | null> {
    return this.answerModel
      .findOneAndUpdate(
        {
          sessionId: new Types.ObjectId(sessionId),
          questionId: new Types.ObjectId(questionId),
        },
        {
          $set: {
            isCorrect,
            marksAwarded,
          },
        },
        { new: true },
      )
      .exec();
  }
}
