import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PracticeQuestion } from './practice-question.schema';
import { User } from '../../users/schemas/user.schema';
import { PracticeQuestionType } from '../enums/practice-question-type.enum';

export type PracticeAttemptDocument = HydratedDocument<PracticeAttempt>;

@Schema({
  collection: 'practice_attempts',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      ret.questionId = ret.questionId?.toString?.() ?? ret.questionId;
      delete ret.__v;
      return ret;
    },
  },
})
export class PracticeAttempt {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: PracticeQuestion.name, required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(PracticeQuestionType) })
  questionType: PracticeQuestionType;

  @Prop({ type: Boolean, required: true })
  isCorrect: boolean;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  score: number;

  @Prop({ type: Number, default: 0, min: 0 })
  timeSpentSeconds: number;

  @Prop({ type: Object, default: null })
  submittedAnswer?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  evaluation?: Record<string, any> | null;

  createdAt: Date;
  updatedAt: Date;
}

export const PracticeAttemptSchema = SchemaFactory.createForClass(PracticeAttempt);
PracticeAttemptSchema.index({ userId: 1, createdAt: -1 });
