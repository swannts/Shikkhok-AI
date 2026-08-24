import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Chapter } from './chapter.schema';

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({
  collection: 'lessons',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
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

  createdAt: Date;
  updatedAt: Date;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
LessonSchema.index({ chapterId: 1, slug: 1 }, { unique: true });
