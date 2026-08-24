import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { NotificationType } from '../enums/notification-type.enum';

export interface NotificationPageCursor {
  createdAt: string;
  id: string;
}

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    payload?: Record<string, any> | null;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      ...data,
      userId: new Types.ObjectId(data.userId),
    });
    return notification.save();
  }

  async findByUserId(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async findPageByUserId(
    userId: string,
    limit: number,
    cursor?: NotificationPageCursor,
  ): Promise<NotificationDocument[]> {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };
    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: new Date(cursor.createdAt) } },
        { createdAt: new Date(cursor.createdAt), _id: { $lt: new Types.ObjectId(cursor.id) } },
      ];
    }

    return this.notificationModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .exec();
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    }).exec();
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId: new Types.ObjectId(userId) },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
  }
}
