import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionPlanRepository {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private readonly planModel: Model<SubscriptionPlanDocument>,
  ) {}

  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlanDocument> {
    const plan = new this.planModel(data);
    return plan.save();
  }

  async findPublished(): Promise<SubscriptionPlanDocument[]> {
    return this.planModel.find({ isPublished: true }).sort({ priceBdt: 1 }).exec();
  }

  async findById(id: string): Promise<SubscriptionPlanDocument | null> {
    return this.planModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<SubscriptionPlanDocument | null> {
    return this.planModel.findOne({ code: code.toUpperCase().trim() }).exec();
  }
}
