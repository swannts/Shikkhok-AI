import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeviceToken, DeviceTokenDocument, DevicePlatform } from '../schemas/device-token.schema';

@Injectable()
export class DeviceTokenRepository {
  constructor(
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async registerToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
    appVersion?: string,
    deviceModel?: string,
  ): Promise<DeviceTokenDocument> {
    const userObjectId = new Types.ObjectId(userId);
    return this.deviceTokenModel
      .findOneAndUpdate(
        { userId: userObjectId, token },
        {
          userId: userObjectId,
          token,
          platform,
          appVersion: appVersion || null,
          deviceModel: deviceModel || null,
          isActive: true,
          lastSeenAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async unregisterToken(userId: string, token: string): Promise<boolean> {
    const res = await this.deviceTokenModel
      .updateOne(
        { userId: new Types.ObjectId(userId), token },
        { isActive: false, lastSeenAt: new Date() },
      )
      .exec();
    return res.modifiedCount > 0;
  }

  async findActiveTokensForUser(userId: string): Promise<DeviceTokenDocument[]> {
    return this.deviceTokenModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .sort({ lastSeenAt: -1 })
      .exec();
  }

  async deactivateInvalidTokens(tokens: string[]): Promise<number> {
    if (!tokens.length) return 0;
    const res = await this.deviceTokenModel
      .updateMany({ token: { $in: tokens } }, { isActive: false, lastSeenAt: new Date() })
      .exec();
    return res.modifiedCount;
  }
}
