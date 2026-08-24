import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { StudyPlanStatus } from '../enums/study-plan-status.enum';

@Schema({ _id: false })
class StudyPlanItem {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, required: false, default: null })
  subjectId?: string | null;

  @Prop({ type: String, required: false, default: null })
  chapterId?: string | null;

  @Prop({ type: String, required: false, default: null })
  lessonId?: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  targetMinutes: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: Boolean, default: false })
  completed: boolean;
}

const StudyPlanItemSchema = SchemaFactory.createForClass(StudyPlanItem);

export type StudyPlanDocument = HydratedDocument<StudyPlan>;

@Schema({
  collection: 'study_plans',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      ret.focusSubjectIds = (ret.focusSubjectIds ?? []).map((id: any) => id?.toString?.() ?? id);
      ret.focusChapterIds = (ret.focusChapterIds ?? []).map((id: any) => id?.toString?.() ?? id);
      ret.focusLessonIds = (ret.focusLessonIds ?? []).map((id: any) => id?.toString?.() ?? id);
      delete ret.__v;
      return ret;
    },
  },
})
export class StudyPlan {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, enum: Object.values(StudyPlanStatus), default: StudyPlanStatus.ACTIVE })
  status: StudyPlanStatus;

  @Prop({ required: true, min: 1, max: 12 })
  classLevel: number;

  @Prop({ required: true, trim: true })
  medium: string;

  @Prop({ required: true, min: 2020, max: 2100 })
  curriculumYear: number;

  @Prop({ type: Number, default: 0, min: 0 })
  weeklyTargetMinutes: number;

  @Prop({ type: Number, default: 0, min: 0 })
  dailyTargetMinutes: number;

  @Prop({ type: [String], default: [] })
  focusSubjectIds: string[];

  @Prop({ type: [String], default: [] })
  focusChapterIds: string[];

  @Prop({ type: [String], default: [] })
  focusLessonIds: string[];

  @Prop({ type: [StudyPlanItemSchema], default: [] })
  items: StudyPlanItem[];

  @Prop({ type: Object, default: null })
  generatedFrom?: Record<string, any> | null;

  @Prop({ type: Date, required: false, default: null })
  startsAt?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  endsAt?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  completedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const StudyPlanSchema = SchemaFactory.createForClass(StudyPlan);
