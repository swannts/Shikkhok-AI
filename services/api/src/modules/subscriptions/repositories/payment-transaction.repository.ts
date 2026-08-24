import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../schemas/payment-transaction.schema';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

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

  async findByManualTrxId(
    paymentMethod: PaymentMethod,
    manualTrxId: string,
  ): Promise<PaymentTransactionDocument | null> {
    return this.txnModel
      .findOne({
        paymentMethod,
        manualTrxId: manualTrxId.toUpperCase().trim(),
      })
      .exec();
  }

  async findPendingManualPayments(limit = 20, skip = 0): Promise<PaymentTransactionDocument[]> {
    return this.txnModel
      .find({ status: PaymentStatus.PENDING_VERIFICATION })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
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

  async updateVerification(
    transactionId: string,
    status: PaymentStatus,
    verifiedBy: string,
    verificationNote?: string,
    failureCode?: string,
    failureMessage?: string,
  ): Promise<PaymentTransactionDocument | null> {
    const update: Record<string, any> = {
      status,
      verifiedAt: new Date(),
      verifiedBy,
    };
    if (status === PaymentStatus.COMPLETED) {
      update.paidAt = new Date();
    }
    if (verificationNote) {
      update.verificationNote = verificationNote;
    }
    if (failureCode) {
      update.failureCode = failureCode;
    }
    if (failureMessage) {
      update.failureMessage = failureMessage;
    }

    return this.txnModel
      .findOneAndUpdate(
        { transactionId: transactionId.toUpperCase().trim() },
        { $set: update },
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
