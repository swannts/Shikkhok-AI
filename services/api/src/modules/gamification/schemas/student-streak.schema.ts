import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type StudentStreakDocument = HydratedDocument<StudentStreak>;

@Schema({
  collection: 'student_streaks',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      delete ret.__v;
      return ret;
    },
  },
})
export class StudentStreak {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  currentStreak: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  longestStreak: number;

  @Prop({ trim: true, default: null })
  lastActiveDate?: string | null;

  @Prop({ type: Number, required: true, default: 1, min: 0 })
  freezeDaysRemaining: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalActiveDays: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalPoints: number;

  createdAt: Date;
  updatedAt: Date;
}

export const StudentStreakSchema = SchemaFactory.createForClass(StudentStreak);
StudentStreakSchema.index({ totalPoints: -1 });
