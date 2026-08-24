import { Injectable, Logger } from '@nestjs/common';
import {
  AdminAuditLogRepository,
  CreateAuditLogData,
} from './repositories/admin-audit-log.repository';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly auditRepository: AdminAuditLogRepository) {}

  async recordAudit(data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditRepository.createLog(data);
      this.logger.log(
        `Audit Log Recorded: Actor ${data.actorUserId}, Action ${data.action}, Resource ${data.resourceType}:${data.resourceId}`,
      );
    } catch (err: any) {
      // Fail-safe: log the error without throwing to avoid aborting primary business transaction
      this.logger.error(
        `Failed to record admin audit log for action ${data.action} on ${data.resourceType}:${data.resourceId}: ${err?.message}`,
        err?.stack,
      );
    }
  }

  async listAuditLogs(
    query: {
      action?: string;
      resourceType?: string;
      actorUserId?: string;
      limit?: number;
      page?: number;
    } = {},
  ): Promise<Record<string, any>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 50, 100));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.action) filter.action = query.action;
    if (query.resourceType) filter.resourceType = query.resourceType;
    if (query.actorUserId) filter.actorUserId = query.actorUserId;

    const [logs, total] = await this.auditRepository.findLogs(filter, limit, skip);

    return {
      auditLogs: logs.map((l) => l.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
