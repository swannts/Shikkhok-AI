import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExamSession } from './exam-session.schema';
import { PracticeQuestion } from '../../practice/schemas/practice-question.schema';

export type ExamAnswerDocument = HydratedDocument<ExamAnswer>;

@Schema({
  collection: 'exam_answers',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.sessionId = ret.sessionId?.toString?.() ?? ret.sessionId;
      ret.questionId = ret.questionId?.toString?.() ?? ret.questionId;
      delete ret.__v;
      return ret;
    },
  },
})
export class ExamAnswer {
  @Prop({ type: Types.ObjectId, ref: ExamSession.name, required: true, index: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: PracticeQuestion.name, required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ type: Object, default: null })
  submittedAnswer?: any;

  @Prop({ type: Boolean, default: null })
  isCorrect?: boolean | null;

  @Prop({ type: Number, default: 0, min: 0 })
  marksAwarded: number;

  @Prop({ type: Boolean, default: false })
  flagged: boolean;

  @Prop({ type: Date, default: () => new Date() })
  answeredAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ExamAnswerSchema = SchemaFactory.createForClass(ExamAnswer);
ExamAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
