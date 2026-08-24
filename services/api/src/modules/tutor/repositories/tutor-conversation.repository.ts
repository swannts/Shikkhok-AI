import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      .sort({ updatedAt: -1 })
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
