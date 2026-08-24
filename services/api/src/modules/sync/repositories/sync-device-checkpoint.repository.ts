import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SyncDeviceCheckpoint,
  SyncDeviceCheckpointDocument,
} from '../schemas/sync-device-checkpoint.schema';

@Injectable()
export class SyncDeviceCheckpointRepository {
  constructor(
    @InjectModel(SyncDeviceCheckpoint.name)
    private readonly checkpointModel: Model<SyncDeviceCheckpointDocument>,
  ) {}

  async upsertCheckpoint(data: {
    userId: string;
    deviceId: string;
    lastSyncedAt: Date;
    lastOperationId?: string | null;
    lastBatchSize: number;
    lastStatus: string;
  }): Promise<SyncDeviceCheckpointDocument> {
    return this.checkpointModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(data.userId),
          deviceId: data.deviceId,
        },
        {
          $set: {
            lastSyncedAt: data.lastSyncedAt,
            lastOperationId: data.lastOperationId ?? null,
            lastBatchSize: data.lastBatchSize,
            lastStatus: data.lastStatus,
          },
          $setOnInsert: {
            userId: new Types.ObjectId(data.userId),
            deviceId: data.deviceId,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findByDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<SyncDeviceCheckpointDocument | null> {
    return this.checkpointModel
      .findOne({
        userId: new Types.ObjectId(userId),
        deviceId,
      })
      .exec();
  }
}
