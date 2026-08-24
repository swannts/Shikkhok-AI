import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PaymentWebhookEvent,
  PaymentWebhookEventDocument,
} from '../schemas/payment-webhook-event.schema';
import { PaymentMethod } from '../enums/payment-method.enum';

@Injectable()
export class PaymentWebhookEventRepository {
  constructor(
    @InjectModel(PaymentWebhookEvent.name)
    private readonly webhookModel: Model<PaymentWebhookEventDocument>,
  ) {}

  async findByProviderAndEventId(
    provider: PaymentMethod,
    eventId: string,
  ): Promise<PaymentWebhookEventDocument | null> {
    return this.webhookModel.findOne({ provider, eventId: eventId.trim() }).exec();
  }

  async recordEvent(data: Partial<PaymentWebhookEvent>): Promise<PaymentWebhookEventDocument> {
    const event = new this.webhookModel(data);
    return event.save();
  }

  async markProcessed(id: string): Promise<PaymentWebhookEventDocument | null> {
    return this.webhookModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'processed', processedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async markFailed(id: string, error: string): Promise<PaymentWebhookEventDocument | null> {
    return this.webhookModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'failed', processedAt: new Date(), error } },
        { new: true },
      )
      .exec();
  }
}
