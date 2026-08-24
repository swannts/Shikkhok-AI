import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { HomeworkSubmission } from './homework-submission.schema';
import { TutorCitation } from '../../tutor/types/tutor-citation.type';

export type HomeworkFeedbackDocument = HydratedDocument<HomeworkFeedback>;

export interface HomeworkCorrectionItem {
  original: string;
  corrected: string;
  explanation: string;
}

@Schema({
  collection: 'homework_feedbacks',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.submissionId = ret.submissionId?.toString?.() ?? ret.submissionId;
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      delete ret.__v;
      return ret;
    },
  },
})
export class HomeworkFeedback {
  @Prop({
    type: Types.ObjectId,
    ref: HomeworkSubmission.name,
    required: true,
    unique: true,
    index: true,
  })
  submissionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  summary: string;

  @Prop({ type: [{ original: String, corrected: String, explanation: String }], default: [] })
  corrections: HomeworkCorrectionItem[];

  @Prop({ type: [String], default: [] })
  strengths: string[];

  @Prop({ type: [String], default: [] })
  weaknesses: string[];

  @Prop({ type: [String], default: [] })
  recommendations: string[];

  @Prop({ type: [Object], default: [] })
  citations: TutorCitation[];

  @Prop({ type: Number, default: null, min: 1, max: 5 })
  rating?: number | null;

  createdAt: Date;
  updatedAt: Date;
}

export const HomeworkFeedbackSchema = SchemaFactory.createForClass(HomeworkFeedback);
HomeworkFeedbackSchema.index({ studentId: 1, createdAt: -1 });
