import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StudentAchievement,
  StudentAchievementDocument,
} from '../schemas/student-achievement.schema';

@Injectable()
export class StudentAchievementRepository {
  constructor(
    @InjectModel(StudentAchievement.name)
    private readonly studentAchievementModel: Model<StudentAchievementDocument>,
  ) {}

  async unlock(data: {
    studentId: string;
    achievementId: string;
    achievementCode: string;
    pointsAwarded: number;
    progress?: number;
  }): Promise<StudentAchievementDocument | null> {
    const studentObjectId = new Types.ObjectId(data.studentId);
    const achievementObjectId = new Types.ObjectId(data.achievementId);

    return this.studentAchievementModel
      .findOneAndUpdate(
        { studentId: studentObjectId, achievementCode: data.achievementCode },
        {
          $setOnInsert: {
            studentId: studentObjectId,
            achievementId: achievementObjectId,
            achievementCode: data.achievementCode,
            pointsAwarded: data.pointsAwarded,
            progress: data.progress ?? 1,
            unlockedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findByStudentId(studentId: string): Promise<StudentAchievementDocument[]> {
    return this.studentAchievementModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ unlockedAt: -1 })
      .exec();
  }

  async findByStudentAndCode(
    studentId: string,
    achievementCode: string,
  ): Promise<StudentAchievementDocument | null> {
    return this.studentAchievementModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        achievementCode,
      })
      .exec();
  }
}
