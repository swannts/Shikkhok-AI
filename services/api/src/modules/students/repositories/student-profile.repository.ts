import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { StudentProfile, StudentProfileDocument } from '../schemas/student-profile.schema';

@Injectable()
export class StudentProfileRepository {
  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
  ) {}

  async findByUserId(userId: string): Promise<StudentProfileDocument | null> {
    return this.studentProfileModel.findOne({ userId }).exec();
  }

  async findById(id: string): Promise<StudentProfileDocument | null> {
    return this.studentProfileModel.findById(id).exec();
  }

  async upsertByUserId(
    userId: string,
    data: Partial<Omit<StudentProfile, 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<StudentProfileDocument> {
    return this.studentProfileModel
      .findOneAndUpdate(
        { userId } as FilterQuery<StudentProfileDocument>,
        { $set: { ...data }, $setOnInsert: { userId } },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }
}
