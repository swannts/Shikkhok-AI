import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Subject } from '../../curriculum/schemas/subject.schema';
import { Chapter } from '../../curriculum/schemas/chapter.schema';
import { PracticeQuestion } from '../../practice/schemas/practice-question.schema';
import { ExamStatus } from '../enums/exam-status.enum';

export type ExamDocument = HydratedDocument<Exam>;

@Schema({
  collection: 'exams',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.subjectId = ret.subjectId?.toString?.() ?? ret.subjectId;
      delete ret.__v;
      return ret;
    },
  },
})
export class Exam {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  titleBn: string;

  @Prop({ type: Types.ObjectId, ref: Subject.name, required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: Chapter.name }], default: [] })
  chapterIds: Types.ObjectId[];

  @Prop({ type: Number, required: true, min: 1, max: 12, index: true })
  classLevel: number;

  @Prop({ required: true, trim: true, default: 'bangla' })
  medium: string;

  @Prop({ type: Number, required: true, min: 2020, max: 2100, index: true })
  curriculumYear: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: PracticeQuestion.name }],
    required: true,
    default: [],
  })
  questionIds: Types.ObjectId[];

  @Prop({ type: Number, required: true, min: 1 })
  timeLimitMinutes: number;

  @Prop({ type: Number, required: true, min: 1 })
  totalMarks: number;

  @Prop({ type: Number, required: false, default: null })
  passMarks?: number | null;

  @Prop({ trim: true, default: '' })
  instructions: string;

  @Prop({ required: true, enum: Object.values(ExamStatus), default: ExamStatus.DRAFT, index: true })
  status: ExamStatus;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
ExamSchema.index({ classLevel: 1, medium: 1, curriculumYear: 1, status: 1 });
ExamSchema.index({ subjectId: 1, status: 1 });
