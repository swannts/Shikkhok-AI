import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudyPlan, StudyPlanDocument } from '../schemas/study-plan.schema';
import { StudyPlanStatus } from '../enums/study-plan-status.enum';

@Injectable()
export class StudyPlanRepository {
  constructor(
    @InjectModel(StudyPlan.name) private readonly studyPlanModel: Model<StudyPlanDocument>,
  ) {}

  async findCurrentByUserId(userId: string): Promise<StudyPlanDocument | null> {
    return this.studyPlanModel
      .findOne({ userId, status: StudyPlanStatus.ACTIVE })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findHistoryByUserId(userId: string): Promise<StudyPlanDocument[]> {
    return this.studyPlanModel.find({ userId }).sort({ updatedAt: -1 }).exec();
  }

  async upsertCurrentPlan(
    userId: string,
    data: Partial<Omit<StudyPlan, 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<StudyPlanDocument> {
    return this.studyPlanModel
      .findOneAndUpdate(
        { userId, status: data.status ?? StudyPlanStatus.ACTIVE },
        { $set: { ...data, userId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
