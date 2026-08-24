import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AchievementCategory } from '../enums/achievement-category.enum';

export type AchievementDocument = HydratedDocument<Achievement>;

@Schema({
  collection: 'achievements',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Achievement {
  @Prop({ required: true, unique: true, trim: true, index: true })
  code: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  titleBn: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  descriptionBn: string;

  @Prop({ trim: true, default: 'https://cdn.shikkhok.ai/badges/default.png' })
  iconUrl: string;

  @Prop({
    required: true,
    enum: Object.values(AchievementCategory),
    default: AchievementCategory.CURRICULUM,
    index: true,
  })
  category: AchievementCategory;

  @Prop({ type: Number, required: true, min: 0, default: 50 })
  points: number;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  targetValue: number;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
AchievementSchema.index({ category: 1, isPublished: 1 });
