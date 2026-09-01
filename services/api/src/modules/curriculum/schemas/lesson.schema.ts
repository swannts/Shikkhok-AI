import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Chapter } from './chapter.schema';
import { LessonContentBlock, LessonContentBlockSchema } from './lesson-content-block.schema';
import {
  normalizeLessonContentBlocks,
  validateLessonContentBlocks,
} from '../types/lesson-content-block';
import { ContentWorkflowStatus } from '../enums/content-workflow-status.enum';

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({
  collection: 'lessons',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      ret.contentVersion = ret.contentVersion ?? 1;
      ret.contentBlocks = normalizeLessonContentBlocks(
        Array.isArray(ret.contentBlocks) ? (ret.contentBlocks as any) : [],
      );
      return ret;
    },
  },
})
export class Lesson {
  @Prop({ type: Types.ObjectId, ref: Chapter.name, required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  summary?: string;

  @Prop({ trim: true })
  textbookReference?: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Number, default: null, required: false })
  pageStart?: number | null;

  @Prop({ type: Number, default: null, required: false })
  pageEnd?: number | null;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  @Prop({
    type: String,
    enum: Object.values(ContentWorkflowStatus),
    default: ContentWorkflowStatus.DRAFT,
    index: true,
  })
  workflowStatus: ContentWorkflowStatus;

  @Prop({ trim: true })
  reviewComments?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  publishedBy?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  publishedAt?: Date;

  @Prop({ type: Number, default: 1 })
  contentVersion: number;

  @Prop({
    type: [LessonContentBlockSchema],
    default: [],
    validate: {
      validator: validateLessonContentBlocks,
      message: 'Invalid lesson content blocks',
    },
  })
  contentBlocks: LessonContentBlock[];

  createdAt: Date;
  updatedAt: Date;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
LessonSchema.index({ chapterId: 1, slug: 1 }, { unique: true });
