import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CurriculumMedium } from '../enums/curriculum-medium.enum';

export type SubjectDocument = HydratedDocument<Subject>;

@Schema({
  collection: 'subjects',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Subject {
  @Prop({ required: true, min: 1, max: 12, index: true })
  classLevel: number;

  @Prop({ required: true, enum: Object.values(CurriculumMedium), index: true })
  medium: CurriculumMedium;

  @Prop({ required: true, min: 2020, max: 2100, index: true })
  curriculumYear: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
SubjectSchema.index({ classLevel: 1, medium: 1, curriculumYear: 1, slug: 1 }, { unique: true });
