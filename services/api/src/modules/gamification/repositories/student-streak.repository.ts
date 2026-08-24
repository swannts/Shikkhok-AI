import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentStreak, StudentStreakDocument } from '../schemas/student-streak.schema';

@Injectable()
export class StudentStreakRepository {
  constructor(
    @InjectModel(StudentStreak.name)
    private readonly streakModel: Model<StudentStreakDocument>,
  ) {}

  async findOrCreate(studentId: string): Promise<StudentStreakDocument> {
    const studentObjectId = new Types.ObjectId(studentId);
    let streak = await this.streakModel.findOne({ studentId: studentObjectId }).exec();
    if (!streak) {
      streak = new this.streakModel({
        studentId: studentObjectId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        freezeDaysRemaining: 1,
        totalActiveDays: 0,
        totalPoints: 0,
      });
      await streak.save();
    }
    return streak;
  }

  async updateStreak(
    studentId: string,
    data: {
      currentStreak: number;
      longestStreak: number;
      lastActiveDate: string;
      freezeDaysRemaining: number;
      totalActiveDays: number;
    },
  ): Promise<StudentStreakDocument | null> {
    return this.streakModel
      .findOneAndUpdate(
        { studentId: new Types.ObjectId(studentId) },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec();
  }

  async addPoints(studentId: string, points: number): Promise<StudentStreakDocument | null> {
    return this.streakModel
      .findOneAndUpdate(
        { studentId: new Types.ObjectId(studentId) },
        { $inc: { totalPoints: points } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getLeaderboard(limit = 20): Promise<StudentStreakDocument[]> {
    return this.streakModel.find().sort({ totalPoints: -1, longestStreak: -1 }).limit(limit).exec();
  }
}
