import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from '../schemas/exam.schema';
import { ExamStatus } from '../enums/exam-status.enum';

@Injectable()
export class ExamRepository {
  constructor(@InjectModel(Exam.name) private readonly examModel: Model<ExamDocument>) {}

  async createExam(data: Partial<Exam>): Promise<ExamDocument> {
    const exam = new this.examModel(data);
    return exam.save();
  }

  async findById(id: string): Promise<ExamDocument | null> {
    return this.examModel.findById(id).exec();
  }

  async findPublished(filter: {
    classLevel?: number;
    medium?: string;
    curriculumYear?: number;
    subjectId?: string;
  }): Promise<ExamDocument[]> {
    const query: Record<string, any> = {
      status: ExamStatus.PUBLISHED,
    };

    if (filter.classLevel !== undefined) {
      query.classLevel = filter.classLevel;
    }

    if (filter.medium) {
      query.medium = filter.medium.toLowerCase().trim();
    }

    if (filter.curriculumYear !== undefined) {
      query.curriculumYear = filter.curriculumYear;
    }

    if (filter.subjectId) {
      query.subjectId = new Types.ObjectId(filter.subjectId);
    }

    return this.examModel.find(query).sort({ createdAt: -1 }).exec();
  }
}
