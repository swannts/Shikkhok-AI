import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PracticeDifficulty } from '../enums/practice-difficulty.enum';
import { PracticeQuestionType } from '../enums/practice-question-type.enum';
import { Subject } from '../../curriculum/schemas/subject.schema';
import { Chapter } from '../../curriculum/schemas/chapter.schema';
import { Lesson } from '../../curriculum/schemas/lesson.schema';

export type PracticeQuestionDocument = HydratedDocument<PracticeQuestion>;

@Schema({
  collection: 'practice_questions',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class PracticeQuestion {
  @Prop({ type: Types.ObjectId, ref: Subject.name, required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Chapter.name, required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Lesson.name, required: true, index: true })
  lessonId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(PracticeQuestionType), index: true })
  questionType: PracticeQuestionType;

  @Prop({ required: true, trim: true })
  prompt: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    required: true,
    enum: Object.values(PracticeDifficulty),
    default: PracticeDifficulty.MEDIUM,
  })
  difficulty: PracticeDifficulty;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ type: [String], default: [] })
  correctOptionIds: string[];

  @Prop({ type: [String], default: [] })
  acceptedAnswers: string[];

  @Prop({ type: Object, default: null })
  answerConfig?: Record<string, any> | null;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PracticeQuestionSchema = SchemaFactory.createForClass(PracticeQuestion);
PracticeQuestionSchema.index({ lessonId: 1, difficulty: 1, isPublished: 1 });
