import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Subject, SubjectDocument } from '../schemas/subject.schema';
import { CurriculumMedium } from '../enums/curriculum-medium.enum';

@Injectable()
export class SubjectRepository {
  constructor(@InjectModel(Subject.name) private readonly subjectModel: Model<SubjectDocument>) {}

  async findPublishedByFilter(filter: {
    classLevel: number;
    medium: CurriculumMedium;
    curriculumYear: number;
  }): Promise<SubjectDocument[]> {
    return this.subjectModel
      .find({
        classLevel: filter.classLevel,
        medium: filter.medium,
        curriculumYear: filter.curriculumYear,
        isPublished: true,
      } as FilterQuery<SubjectDocument>)
      .sort({ order: 1, name: 1 })
      .exec();
  }

  async findById(id: string): Promise<SubjectDocument | null> {
    return this.subjectModel.findById(id).exec();
  }
}
