import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SyncEvent, SyncEventDocument } from '../schemas/sync-event.schema';
import { SyncEventStatus } from '../enums/sync-event-status.enum';

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

  async getOrCreatePendingEvent(data: {
    userId: string;
    operationId: string;
    operationType: SyncEvent['operationType'];
    entityType: string;
    entityId?: string | null;
    payload?: Record<string, any> | null;
  }): Promise<SyncEventDocument> {
    const userObjectId = new Types.ObjectId(data.userId);
    try {
      return await this.syncEventModel
        .findOneAndUpdate(
          { userId: userObjectId, operationId: data.operationId },
          {
            $setOnInsert: {
              userId: userObjectId,
              operationId: data.operationId,
              operationType: data.operationType,
              entityType: data.entityType,
              entityId: data.entityId ?? null,
              payload: data.payload ?? null,
              status: SyncEventStatus.PENDING,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )
        .exec();
    } catch (error: any) {
      if (error?.code === 11000) {
        const existing = await this.findByOperationId(data.userId, data.operationId);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async claimForProcessing(userId: string, operationId: string): Promise<SyncEventDocument | null> {
    return this.syncEventModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          operationId,
          status: { $in: [SyncEventStatus.PENDING, SyncEventStatus.FAILED] },
        },
        {
          $set: {
            status: SyncEventStatus.PROCESSING,
            startedAt: new Date(),
            errorCode: null,
            errorMessage: null,
          },
        },
        { new: true },
      )
      .exec();
  }

  async markApplied(
    userId: string,
    operationId: string,
    result: Record<string, any>,
  ): Promise<SyncEventDocument | null> {
    return this.syncEventModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          operationId,
        },
        {
          $set: {
            status: SyncEventStatus.APPLIED,
            result,
            appliedAt: new Date(),
            errorCode: null,
            errorMessage: null,
          },
        },
        { new: true },
      )
      .exec();
  }

  async markFailed(
    userId: string,
    operationId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<SyncEventDocument | null> {
    return this.syncEventModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          operationId,
        },
        {
          $set: {
            status: SyncEventStatus.FAILED,
            errorCode,
            errorMessage,
          },
        },
        { new: true },
      )
      .exec();
  }
}
