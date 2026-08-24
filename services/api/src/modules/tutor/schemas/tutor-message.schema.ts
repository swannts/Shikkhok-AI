import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';
import { TutorCitation } from '../types/tutor-citation.type';

@Schema({ _id: false })
class TutorTokenUsage {
  @Prop({ type: Number, default: 0, min: 0 })
  promptTokens: number;

  @Prop({ type: Number, default: 0, min: 0 })
  completionTokens: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalTokens: number;
}

const TutorTokenUsageSchema = SchemaFactory.createForClass(TutorTokenUsage);

export type TutorMessageDocument = HydratedDocument<TutorMessage>;

@Schema({
  collection: 'tutor_messages',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.conversationId = ret.conversationId?.toString?.() ?? ret.conversationId;
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class TutorMessage {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TutorMessageRole), index: true })
  role: TutorMessageRole;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({
    type: [
      {
        sourceId: String,
        sourceBook: { type: String, required: true },
        classLevel: Number,
        subject: String,
        chapter: String,
        pageNumber: Number,
        excerpt: String,
        sourceUrl: String,
      },
    ],
    default: [],
  })
  citations: TutorCitation[];

  @Prop({ trim: true, default: null })
  provider?: string | null;

  @Prop({ type: TutorTokenUsageSchema, default: null })
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  updatedAt: Date;
}

export const TutorMessageSchema = SchemaFactory.createForClass(TutorMessage);
TutorMessageSchema.index({ conversationId: 1, createdAt: 1, _id: 1 });
TutorMessageSchema.index({ userId: 1, createdAt: -1, _id: -1 });
