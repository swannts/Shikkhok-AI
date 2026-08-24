import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StudentSubscription,
  StudentSubscriptionDocument,
} from '../schemas/student-subscription.schema';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

@Injectable()
export class StudentSubscriptionRepository {
  constructor(
    @InjectModel(StudentSubscription.name)
    private readonly subModel: Model<StudentSubscriptionDocument>,
  ) {}

  async findActiveByUserId(userId: string): Promise<StudentSubscriptionDocument | null> {
    return this.subModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gte: new Date() },
      })
      .sort({ endDate: -1 })
      .exec();
  }

  async activateSubscription(
    data: Partial<StudentSubscription>,
  ): Promise<StudentSubscriptionDocument> {
    const sub = new this.subModel(data);
    return sub.save();
  }

  async deactivatePreviousSubscriptions(userId: string): Promise<void> {
    await this.subModel
      .updateMany(
        { userId: new Types.ObjectId(userId), status: SubscriptionStatus.ACTIVE },
        { $set: { status: SubscriptionStatus.EXPIRED } },
      )
      .exec();
  }
}
