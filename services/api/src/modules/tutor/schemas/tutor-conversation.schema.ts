import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';

@Schema({ _id: false })
class TutorMessage {
  @Prop({ required: true, enum: Object.values(TutorMessageRole) })
  role: TutorMessageRole;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [Object], default: [] })
  citations: Array<Record<string, any>>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

const TutorMessageSchema = SchemaFactory.createForClass(TutorMessage);

export type TutorConversationDocument = HydratedDocument<TutorConversation>;

@Schema({
  collection: 'tutor_conversations',
  timestamps: true,
  toJSON: {
    transform(_doc: any, ret: Record<string, any>) {
      ret.userId = ret.userId?.toString?.() ?? ret.userId;
      delete ret.__v;
      return ret;
    },
  },
})
export class TutorConversation {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  subjectId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  chapterId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  lessonId?: Types.ObjectId | null;

  @Prop({ required: true, min: 1, max: 12 })
  classLevel: number;

  @Prop({ trim: true })
  medium?: string;

  @Prop({ required: true, trim: true })
  curriculumYear: string;

  @Prop({ type: [TutorMessageSchema], default: [] })
  messages: TutorMessage[];

  @Prop({ type: Date, default: Date.now })
  lastMessageAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TutorConversationSchema = SchemaFactory.createForClass(TutorConversation);
