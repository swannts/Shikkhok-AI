import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TutorMessage, TutorMessageDocument } from '../schemas/tutor-message.schema';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';
import { TutorCitation } from '../types/tutor-citation.type';

@Injectable()
export class TutorMessageRepository {
  constructor(
    @InjectModel(TutorMessage.name)
    private readonly messageModel: Model<TutorMessageDocument>,
  ) {}

  async createMessage(data: {
    conversationId: string;
    userId: string;
    role: TutorMessageRole;
    content: string;
    citations?: TutorCitation[];
    provider?: string | null;
    tokenUsage?: Record<string, number> | null;
  }): Promise<TutorMessageDocument> {
    const message = new this.messageModel({
      ...data,
      conversationId: new Types.ObjectId(data.conversationId),
      userId: new Types.ObjectId(data.userId),
    });
    return message.save();
  }

  async findByConversationCursor(
    conversationId: string,
    limit: number,
    cursor?: { createdAt: string; id: string },
  ): Promise<TutorMessageDocument[]> {
    const filter: Record<string, any> = {
      conversationId: new Types.ObjectId(conversationId),
    };

    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: new Date(cursor.createdAt) } },
        { createdAt: new Date(cursor.createdAt), _id: { $lt: new Types.ObjectId(cursor.id) } },
      ];
    }

    return this.messageModel.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).exec();
  }

  async countByConversation(conversationId: string): Promise<number> {
    return this.messageModel.countDocuments({ conversationId: new Types.ObjectId(conversationId) }).exec();
  }
}
