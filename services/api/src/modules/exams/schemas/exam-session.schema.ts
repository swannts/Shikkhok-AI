import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Exam } from './exam.schema';
import { ExamSessionStatus } from '../enums/exam-session-status.enum';

export type ExamSessionDocument = HydratedDocument<ExamSession>;

@Schema({
  collection: 'exam_sessions',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      ret.examId = ret.examId?.toString?.() ?? ret.examId;
      delete ret.__v;
      return ret;
    },
  },
})
export class ExamSession {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Exam.name, required: true, index: true })
  examId: Types.ObjectId;

  @Prop({ type: Date, required: true, default: () => new Date() })
  startedAt: Date;

  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({
    required: true,
    enum: Object.values(ExamSessionStatus),
    default: ExamSessionStatus.ACTIVE,
    index: true,
  })
  status: ExamSessionStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  score: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  percentage: number;

  @Prop({ type: Number, default: 0, min: 0 })
  correctCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  wrongCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  unansweredCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ExamSessionSchema = SchemaFactory.createForClass(ExamSession);
ExamSessionSchema.index({ studentId: 1, createdAt: -1 });
ExamSessionSchema.index({ examId: 1, studentId: 1 });
ExamSessionSchema.index({ status: 1, expiresAt: 1 });
