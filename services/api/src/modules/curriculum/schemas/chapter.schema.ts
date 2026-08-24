import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Subject } from './subject.schema';

export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({
  collection: 'chapters',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Chapter {
  @Prop({ type: Types.ObjectId, ref: Subject.name, required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  summary?: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Number, default: null, required: false })
  estimatedMinutes?: number | null;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ subjectId: 1, slug: 1 }, { unique: true });
