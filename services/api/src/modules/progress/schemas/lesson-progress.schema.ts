import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProgressStatus } from '../enums/progress-status.enum';
import { User } from '../../users/schemas/user.schema';

export type LessonProgressDocument = HydratedDocument<LessonProgress>;

@Schema({
  collection: 'lesson_progress',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      ret.subjectId = ret.subjectId?.toString?.() ?? ret.subjectId;
      ret.chapterId = ret.chapterId?.toString?.() ?? ret.chapterId;
      ret.lessonId = ret.lessonId?.toString?.() ?? ret.lessonId;
      delete ret.__v;
      return ret;
    },
  },
})
export class LessonProgress {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  lessonId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ProgressStatus), default: ProgressStatus.NOT_STARTED })
  status: ProgressStatus;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progressPercent: number;

  @Prop({ type: Number, default: 0, min: 0 })
  timeSpentMinutes: number;

  @Prop({ type: Number, default: 0, min: 0 })
  attemptCount: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  masteryScore: number;

  @Prop({ type: Date, required: false, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, required: false, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, required: false, default: null })
  lastAccessedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonProgressSchema.index({ userId: 1, subjectId: 1 });
LessonProgressSchema.index({ userId: 1, chapterId: 1 });
