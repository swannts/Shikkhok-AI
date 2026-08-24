import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamSession, ExamSessionDocument } from '../schemas/exam-session.schema';
import { ExamSessionStatus } from '../enums/exam-session-status.enum';

@Injectable()
export class ExamSessionRepository {
  constructor(
    @InjectModel(ExamSession.name)
    private readonly sessionModel: Model<ExamSessionDocument>,
  ) {}

  async createSession(data: {
    studentId: string;
    examId: string;
    startedAt: Date;
    expiresAt: Date;
    status: ExamSessionStatus;
  }): Promise<ExamSessionDocument> {
    const session = new this.sessionModel({
      studentId: new Types.ObjectId(data.studentId),
      examId: new Types.ObjectId(data.examId),
      startedAt: data.startedAt,
      expiresAt: data.expiresAt,
      status: data.status,
      score: 0,
      percentage: 0,
      correctCount: 0,
      wrongCount: 0,
      unansweredCount: 0,
    });
    return session.save();
  }

  async findById(sessionId: string): Promise<ExamSessionDocument | null> {
    return this.sessionModel.findById(sessionId).exec();
  }

  async findActiveSession(studentId: string, examId: string): Promise<ExamSessionDocument | null> {
    return this.sessionModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        examId: new Types.ObjectId(examId),
        status: ExamSessionStatus.ACTIVE,
      })
      .exec();
  }

  async findByStudentId(studentId: string): Promise<ExamSessionDocument[]> {
    return this.sessionModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(
    sessionId: string,
    status: ExamSessionStatus,
  ): Promise<ExamSessionDocument | null> {
    return this.sessionModel
      .findByIdAndUpdate(sessionId, { $set: { status } }, { new: true })
      .exec();
  }

  async submitSession(
    sessionId: string,
    data: {
      score: number;
      percentage: number;
      correctCount: number;
      wrongCount: number;
      unansweredCount: number;
      submittedAt: Date;
    },
  ): Promise<ExamSessionDocument | null> {
    return this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        {
          $set: {
            status: ExamSessionStatus.SUBMITTED,
            score: data.score,
            percentage: data.percentage,
            correctCount: data.correctCount,
            wrongCount: data.wrongCount,
            unansweredCount: data.unansweredCount,
            submittedAt: data.submittedAt,
          },
        },
        { new: true },
      )
      .exec();
  }
}
