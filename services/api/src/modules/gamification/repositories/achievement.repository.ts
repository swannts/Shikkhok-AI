import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Achievement, AchievementDocument } from '../schemas/achievement.schema';

@Injectable()
export class AchievementRepository {
  constructor(
    @InjectModel(Achievement.name)
    private readonly achievementModel: Model<AchievementDocument>,
  ) {}

  async createAchievement(data: Partial<Achievement>): Promise<AchievementDocument> {
    const achievement = new this.achievementModel(data);
    return achievement.save();
  }

  async findAllPublished(): Promise<AchievementDocument[]> {
    return this.achievementModel.find({ isPublished: true }).sort({ points: 1 }).exec();
  }

  async findByCode(code: string): Promise<AchievementDocument | null> {
    return this.achievementModel.findOne({ code, isPublished: true }).exec();
  }
}
