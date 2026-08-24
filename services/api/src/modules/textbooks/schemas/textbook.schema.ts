import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Subject } from '../../curriculum/schemas/subject.schema';

export type TextbookDocument = HydratedDocument<Textbook>;

@Schema({
  collection: 'textbooks',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.subjectId = ret.subjectId?.toString?.() ?? ret.subjectId;
      delete ret.__v;
      return ret;
    },
  },
})
export class Textbook {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  titleBn: string;

  @Prop({ type: Types.ObjectId, ref: Subject.name, required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 12, index: true })
  classLevel: number;

  @Prop({ required: true, trim: true, default: 'bangla' })
  medium: string;

  @Prop({ type: Number, required: true, min: 2020, max: 2100, index: true })
  curriculumYear: number;

  @Prop({ trim: true, default: '2026 Revised Edition' })
  edition: string;

  @Prop({ trim: true, default: '' })
  coverImageUrl: string;

  @Prop({ trim: true, default: '' })
  pdfUrl?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  totalChapters: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalLessons: number;

  @Prop({ type: Number, default: 0, min: 0 })
  fileSizeBytes: number;

  @Prop({ trim: true, default: '' })
  checksumSha256: string;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TextbookSchema = SchemaFactory.createForClass(Textbook);
TextbookSchema.index({ classLevel: 1, medium: 1, curriculumYear: 1, isPublished: 1 });
TextbookSchema.index({ subjectId: 1, isPublished: 1 });
