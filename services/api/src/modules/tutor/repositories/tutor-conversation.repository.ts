import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { TutorConversation, TutorConversationDocument } from '../schemas/tutor-conversation.schema';

@Injectable()
export class TutorConversationRepository {
  constructor(
    @InjectModel(TutorConversation.name)
    private readonly conversationModel: Model<TutorConversationDocument>,
  ) {}

  async createConversation(data: Partial<TutorConversation>): Promise<TutorConversationDocument> {
    const conversation = new this.conversationModel(data);
    return conversation.save();
  }

  async findById(id: string): Promise<TutorConversationDocument | null> {
    return this.conversationModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<TutorConversationDocument[]> {
    return this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1, _id: -1 })
      .exec();
  }

  async findByUserIdCursor(
    userId: string,
    limit: number,
    cursor?: { updatedAt: string; id: string },
  ): Promise<TutorConversationDocument[]> {
    const filter: FilterQuery<TutorConversationDocument> = {
      userId: new Types.ObjectId(userId),
    };

    if (cursor) {
      filter.$or = [
        { updatedAt: { $lt: new Date(cursor.updatedAt) } },
        { updatedAt: new Date(cursor.updatedAt), _id: { $lt: new Types.ObjectId(cursor.id) } },
      ];
    }

    return this.conversationModel
      .find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit)
      .exec();
  }

  async touchConversation(
    conversationId: string,
    messageCountIncrement = 0,
  ): Promise<TutorConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          $inc: { messageCount: messageCountIncrement },
          $set: { lastMessageAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }
}
