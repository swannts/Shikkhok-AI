import { HealthService } from './health.service';
import { Connection } from 'mongoose';
import { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockMongoConnection: Partial<Connection>;
  let mockRedisService: Partial<RedisService>;

  beforeEach(() => {
    mockMongoConnection = {
      readyState: 1,
    };
    mockRedisService = {
      getClient: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue('PONG'),
      }),
    };
    service = new HealthService(
      mockMongoConnection as Connection,
      mockRedisService as RedisService,
    );
  });

  it('should return live status for liveness probe', () => {
    const liveness = service.getLiveness();
    expect(liveness.status).toBe('ok');
    expect(liveness.timestamp).toBeDefined();
  });

  it('should return ok readiness status when MongoDB and Redis are up', async () => {
    const readiness = await service.getReadiness();
    expect(readiness.status).toBe('ok');
    expect(readiness.services.mongodb).toBe('up');
    expect(readiness.services.redis).toBe('up');
  });

  it('should return degraded readiness status when Redis is down', async () => {
    (mockRedisService.getClient as jest.Mock).mockReturnValue({
      ping: jest.fn().mockRejectedValue(new Error('Connection refused')),
    });

    const readiness = await service.getReadiness();
    expect(readiness.status).toBe('degraded');
    expect(readiness.services.mongodb).toBe('up');
    expect(readiness.services.redis).toBe('down');
  });

  it('should return Prometheus formatted metrics string', async () => {
    const metrics = await service.getMetrics();
    expect(metrics).toContain('process_resident_memory_bytes');
    expect(metrics).toContain('shikkhok_mongodb_connected 1');
    expect(metrics).toContain('shikkhok_redis_connected 1');
  });
});
