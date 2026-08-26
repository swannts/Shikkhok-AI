import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LessonContentBlockType, LessonImportantNoteSeverity } from '../types/lesson-content-block';

@Schema({ _id: false })
export class LessonContentBlock {
  @Prop({ required: true, trim: true, maxlength: 120 })
  id: string;

  @Prop({ required: true, enum: Object.values(LessonContentBlockType) })
  type: LessonContentBlockType;

  @Prop({ required: true, type: Number, min: 0 })
  order: number;

  @Prop({ trim: true, maxlength: 10000 })
  text?: string;

  @Prop({ type: Number, min: 1, max: 3, default: null })
  level?: 1 | 2 | 3 | null;

  @Prop({ trim: true, maxlength: 10000 })
  expression?: string;

  @Prop({ trim: true, maxlength: 10000 })
  description?: string;

  @Prop({ trim: true, maxlength: 1000 })
  title?: string;

  @Prop({ trim: true, maxlength: 10000 })
  body?: string;

  @Prop({ trim: true, maxlength: 10000 })
  solution?: string;

  @Prop({ trim: true, enum: Object.values(LessonImportantNoteSeverity) })
  severity?: LessonImportantNoteSeverity;

  @Prop({ trim: true, maxlength: 2048 })
  url?: string;

  @Prop({ trim: true, maxlength: 500 })
  altText?: string;

  @Prop({ trim: true, maxlength: 1000 })
  caption?: string;

  @Prop({ type: [String], default: [] })
  headers?: string[];

  @Prop({ type: [[String]], default: [] })
  rows?: string[][];

  @Prop({ trim: true, maxlength: 300 })
  bookName?: string;

  @Prop({ trim: true, maxlength: 200 })
  chapter?: string;

  @Prop({ trim: true, maxlength: 200 })
  page?: string;

  @Prop({ trim: true, maxlength: 2000 })
  excerpt?: string;

  @Prop({ type: [String], default: [] })
  items?: string[];

  @Prop({ type: Boolean, default: null })
  ordered?: boolean | null;

  @Prop({ trim: true, maxlength: 200 })
  attribution?: string;
}

export const LessonContentBlockSchema = SchemaFactory.createForClass(LessonContentBlock);
