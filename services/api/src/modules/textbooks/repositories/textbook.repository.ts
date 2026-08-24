import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Textbook, TextbookDocument } from '../schemas/textbook.schema';

@Injectable()
export class TextbookRepository {
  constructor(
    @InjectModel(Textbook.name)
    private readonly textbookModel: Model<TextbookDocument>,
  ) {}

  async createTextbook(data: Partial<Textbook>): Promise<TextbookDocument> {
    const textbook = new this.textbookModel(data);
    return textbook.save();
  }

  async findById(id: string): Promise<TextbookDocument | null> {
    return this.textbookModel.findById(id).exec();
  }

  async findPublished(filter: {
    classLevel?: number;
    medium?: string;
    curriculumYear?: number;
    subjectId?: string;
  }): Promise<TextbookDocument[]> {
    const query: Record<string, any> = {
      isPublished: true,
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

    return this.textbookModel.find(query).sort({ classLevel: 1, title: 1 }).exec();
  }
}
