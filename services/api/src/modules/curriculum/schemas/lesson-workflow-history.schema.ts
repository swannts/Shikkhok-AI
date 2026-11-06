import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ContentWorkflowStatus } from '../enums/content-workflow-status.enum';

@Schema({ _id: false })
export class LessonWorkflowHistoryEntry {
  @Prop({ type: String, enum: Object.values(ContentWorkflowStatus), default: null })
  fromStatus: ContentWorkflowStatus | null;

  @Prop({ type: String, enum: Object.values(ContentWorkflowStatus), required: true })
  toStatus: ContentWorkflowStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  actorUserId?: Types.ObjectId | null;

  @Prop({ type: String, maxlength: 2000, default: null })
  reviewComments?: string | null;

  @Prop({ type: Date, required: true, default: Date.now })
  changedAt: Date;
}

export const LessonWorkflowHistoryEntrySchema = SchemaFactory.createForClass(
  LessonWorkflowHistoryEntry,
);
