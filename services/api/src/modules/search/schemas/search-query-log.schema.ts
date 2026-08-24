import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SearchQueryLogDocument = HydratedDocument<SearchQueryLog>;

@Schema({
  collection: 'search_queries',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class SearchQueryLog {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  query: string;

  @Prop({ type: Number, required: true, min: 1, max: 12, index: true })
  classLevel: number;

  @Prop({ required: true, trim: true, default: 'bangla' })
  medium: string;

  @Prop({ type: Number, default: 0, min: 0 })
  resultCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const SearchQueryLogSchema = SchemaFactory.createForClass(SearchQueryLog);
SearchQueryLogSchema.index({ classLevel: 1, query: 1 });
SearchQueryLogSchema.index({ createdAt: -1 });
