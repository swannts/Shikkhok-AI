import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminAuditLog, AdminAuditLogDocument } from '../schemas/admin-audit-log.schema';

export interface CreateAuditLogData {
  actorUserId: Types.ObjectId | string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

@Injectable()
export class AdminAuditLogRepository {
  constructor(
    @InjectModel(AdminAuditLog.name)
    private readonly auditModel: Model<AdminAuditLogDocument>,
  ) {}

  async createLog(data: CreateAuditLogData): Promise<AdminAuditLogDocument> {
    const log = new this.auditModel({
      ...data,
      actorUserId:
        typeof data.actorUserId === 'string'
          ? new Types.ObjectId(data.actorUserId)
          : data.actorUserId,
    });
    return log.save();
  }

  async findLogs(
    filter: Record<string, any> = {},
    limit = 50,
    skip = 0,
  ): Promise<[AdminAuditLogDocument[], number]> {
    const [logs, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorUserId', 'name email role')
        .exec(),
      this.auditModel.countDocuments(filter),
    ]);
    return [logs, total];
  }
}
