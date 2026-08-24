import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ParentProfile, ParentProfileDocument } from '../schemas/parent-profile.schema';

@Injectable()
export class ParentProfileRepository {
  constructor(
    @InjectModel(ParentProfile.name)
    private readonly parentProfileModel: Model<ParentProfileDocument>,
  ) {}

  async findByUserId(userId: string): Promise<ParentProfileDocument | null> {
    return this.parentProfileModel.findOne({ userId }).exec();
  }

  async upsertProfile(
    userId: string,
    data: Partial<Omit<ParentProfile, 'userId' | 'linkedStudentIds' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ParentProfileDocument> {
    return this.parentProfileModel
      .findOneAndUpdate(
        { userId },
        { $set: data, $setOnInsert: { userId, linkedStudentIds: [] } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async addLinkedStudent(userId: string, studentUserId: string): Promise<ParentProfileDocument> {
    return this.parentProfileModel
      .findOneAndUpdate(
        { userId },
        {
          $addToSet: { linkedStudentIds: new Types.ObjectId(studentUserId) },
          $setOnInsert: { userId, linkedStudentIds: [] },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async removeLinkedStudent(
    userId: string,
    studentUserId: string,
  ): Promise<ParentProfileDocument | null> {
    return this.parentProfileModel
      .findOneAndUpdate(
        { userId },
        { $pull: { linkedStudentIds: new Types.ObjectId(studentUserId) } },
        { new: true },
      )
      .exec();
  }

  async updateAlertSettings(
    userId: string,
    settings: Partial<ParentProfile['alertSettings']>,
  ): Promise<ParentProfileDocument | null> {
    const updateFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        updateFields[`alertSettings.${key}`] = value;
      }
    }

    return this.parentProfileModel
      .findOneAndUpdate(
        { userId },
        { $set: updateFields },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
