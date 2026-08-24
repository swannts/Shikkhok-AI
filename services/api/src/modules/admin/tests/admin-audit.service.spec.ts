import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuditService } from '../admin-audit.service';
import { AdminAuditLogRepository } from '../repositories/admin-audit-log.repository';

describe('AdminAuditService', () => {
  let service: AdminAuditService;
  let repository: jest.Mocked<AdminAuditLogRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuditService,
        {
          provide: AdminAuditLogRepository,
          useValue: {
            createLog: jest.fn(),
            findLogs: jest.fn().mockResolvedValue([[], 0]),
          },
        },
      ],
    }).compile();

    service = module.get(AdminAuditService);
    repository = module.get(AdminAuditLogRepository);
  });

  it('should record audit log safely without throwing if repository fails (Fail-safe)', async () => {
    repository.createLog.mockRejectedValue(new Error('DB connection glitch'));

    await expect(
      service.recordAudit({
        actorUserId: 'admin-1',
        action: 'UPDATE_STATUS',
        resourceType: 'USER',
        resourceId: 'target-1',
      }),
    ).resolves.not.toThrow();
  });

  it('should query and paginate audit logs', async () => {
    repository.findLogs.mockResolvedValue([
      [
        {
          toJSON: () => ({
            action: 'CREATE_SUBJECT',
            resourceType: 'CURRICULUM_SUBJECT',
          }),
        } as any,
      ],
      1,
    ]);

    const result = await service.listAuditLogs({ limit: 10, page: 1 });
    expect(result.auditLogs).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});
