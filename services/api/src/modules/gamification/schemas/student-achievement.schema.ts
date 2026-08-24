import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Achievement } from './achievement.schema';

export type StudentAchievementDocument = HydratedDocument<StudentAchievement>;

@Schema({
  collection: 'student_achievements',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      ret.achievementId = ret.achievementId?.toString?.() ?? ret.achievementId;
      delete ret.__v;
      return ret;
    },
  },
})
export class StudentAchievement {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Achievement.name, required: true, index: true })
  achievementId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  achievementCode: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  unlockedAt: Date;

  @Prop({ type: Number, required: true, min: 0, default: 50 })
  pointsAwarded: number;

  @Prop({ type: Number, required: true, min: 0, default: 1 })
  progress: number;

  createdAt: Date;
  updatedAt: Date;
}

export const StudentAchievementSchema = SchemaFactory.createForClass(StudentAchievement);
StudentAchievementSchema.index({ studentId: 1, achievementCode: 1 }, { unique: true });
StudentAchievementSchema.index({ studentId: 1, unlockedAt: -1 });
