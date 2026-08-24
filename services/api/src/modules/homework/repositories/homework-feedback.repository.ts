import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HomeworkFeedback,
  HomeworkFeedbackDocument,
  HomeworkCorrectionItem,
} from '../schemas/homework-feedback.schema';
import { TutorCitation } from '../../tutor/types/tutor-citation.type';

@Injectable()
export class HomeworkFeedbackRepository {
  constructor(
    @InjectModel(HomeworkFeedback.name)
    private readonly feedbackModel: Model<HomeworkFeedbackDocument>,
  ) {}

  async createFeedback(data: {
    submissionId: string;
    studentId: string;
    summary: string;
    corrections?: HomeworkCorrectionItem[];
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    citations?: TutorCitation[];
  }): Promise<HomeworkFeedbackDocument> {
    const feedback = new this.feedbackModel({
      submissionId: new Types.ObjectId(data.submissionId),
      studentId: new Types.ObjectId(data.studentId),
      summary: data.summary,
      corrections: data.corrections ?? [],
      strengths: data.strengths ?? [],
      weaknesses: data.weaknesses ?? [],
      recommendations: data.recommendations ?? [],
      citations: data.citations ?? [],
      rating: null,
    });
    return feedback.save();
  }

  async findBySubmissionId(submissionId: string): Promise<HomeworkFeedbackDocument | null> {
    return this.feedbackModel.findOne({ submissionId: new Types.ObjectId(submissionId) }).exec();
  }

  async setRating(submissionId: string, rating: number): Promise<HomeworkFeedbackDocument | null> {
    return this.feedbackModel
      .findOneAndUpdate(
        { submissionId: new Types.ObjectId(submissionId) },
        { $set: { rating } },
        { new: true },
      )
      .exec();
  }
}
