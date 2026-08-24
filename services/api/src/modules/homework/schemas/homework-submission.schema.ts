import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Subject } from '../../curriculum/schemas/subject.schema';
import { Chapter } from '../../curriculum/schemas/chapter.schema';
import { Lesson } from '../../curriculum/schemas/lesson.schema';
import { HomeworkStatus } from '../enums/homework-status.enum';

export type HomeworkSubmissionDocument = HydratedDocument<HomeworkSubmission>;

@Schema({
  collection: 'homework_submissions',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.studentId = ret.studentId?.toString?.() ?? ret.studentId;
      if (ret.subjectId) ret.subjectId = ret.subjectId?.toString?.() ?? ret.subjectId;
      if (ret.chapterId) ret.chapterId = ret.chapterId?.toString?.() ?? ret.chapterId;
      if (ret.lessonId) ret.lessonId = ret.lessonId?.toString?.() ?? ret.lessonId;
      delete ret.__v;
      return ret;
    },
  },
})
export class HomeworkSubmission {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Subject.name, default: null })
  subjectId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Chapter.name, default: null })
  chapterId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Lesson.name, default: null })
  lessonId?: Types.ObjectId | null;

  @Prop({ type: [String], required: true, default: [] })
  imageUrls: string[];

  @Prop({ trim: true, default: '' })
  rawText?: string;

  @Prop({ trim: true, default: '' })
  prompt?: string;

  @Prop({
    required: true,
    enum: Object.values(HomeworkStatus),
    default: HomeworkStatus.PENDING,
    index: true,
  })
  status: HomeworkStatus;

  @Prop({ trim: true, default: null })
  ocrText?: string | null;

  @Prop({ trim: true, default: null })
  errorMessage?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const HomeworkSubmissionSchema = SchemaFactory.createForClass(HomeworkSubmission);
HomeworkSubmissionSchema.index({ studentId: 1, createdAt: -1 });
HomeworkSubmissionSchema.index({ status: 1, createdAt: 1 });
