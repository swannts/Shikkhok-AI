import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SyncEvent, SyncEventDocument } from '../schemas/sync-event.schema';

@Injectable()
export class SyncEventRepository {
  constructor(
    @InjectModel(SyncEvent.name) private readonly syncEventModel: Model<SyncEventDocument>,
  ) {}

  async createEvent(data: Partial<SyncEvent>): Promise<SyncEventDocument> {
    const event = new this.syncEventModel(data);
    return event.save();
  }

  async findByOperationId(userId: string, operationId: string): Promise<SyncEventDocument | null> {
    return this.syncEventModel.findOne({
      userId: new Types.ObjectId(userId),
      operationId,
    }).exec();
  }

  async findByUserId(userId: string): Promise<SyncEventDocument[]> {
    return this.syncEventModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }
}
