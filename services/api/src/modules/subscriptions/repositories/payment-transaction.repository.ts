import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../schemas/payment-transaction.schema';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class PaymentTransactionRepository {
  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly txnModel: Model<PaymentTransactionDocument>,
  ) {}

  async createTransaction(data: Partial<PaymentTransaction>): Promise<PaymentTransactionDocument> {
    const txn = new this.txnModel(data);
    return txn.save();
  }

  async findByTransactionId(transactionId: string): Promise<PaymentTransactionDocument | null> {
    return this.txnModel.findOne({ transactionId: transactionId.toUpperCase().trim() }).exec();
  }

  async updateStatus(
    transactionId: string,
    status: PaymentStatus,
    paidAt?: Date,
  ): Promise<PaymentTransactionDocument | null> {
    return this.txnModel
      .findOneAndUpdate(
        { transactionId: transactionId.toUpperCase().trim() },
        { $set: { status, paidAt: paidAt ?? new Date() } },
        { new: true },
      )
      .exec();
  }

  async findByUserId(userId: string): Promise<PaymentTransactionDocument[]> {
    return this.txnModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
