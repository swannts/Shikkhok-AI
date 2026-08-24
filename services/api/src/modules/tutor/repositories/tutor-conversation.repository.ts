import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TutorConversation, TutorConversationDocument } from '../schemas/tutor-conversation.schema';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';

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
    return this.conversationModel.find({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 }).exec();
  }

  async appendMessage(
    conversationId: string,
    message: {
      role: TutorMessageRole;
      content: string;
      citations?: Array<Record<string, any>>;
    },
  ): Promise<TutorConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          $push: {
            messages: {
              ...message,
              createdAt: new Date(),
            },
          },
          $set: { lastMessageAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }
}
