import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly redisService: RedisService,
  ) {}

  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    let mongoStatus = 'down';
    let redisStatus = 'down';

    try {
      if (this.mongoConnection.readyState === 1) {
        mongoStatus = 'up';
      }
    } catch {
      mongoStatus = 'down';
    }

    try {
      const pong = await this.redisService.getClient().ping();
      if (pong === 'PONG') {
        redisStatus = 'up';
      }
    } catch {
      redisStatus = 'down';
    }

    const isReady = mongoStatus === 'up' && redisStatus === 'up';

    return {
      status: isReady ? 'ok' : 'degraded',
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
        websocket: redisStatus === 'up' ? 'adapter_ready' : 'adapter_pending',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getMetrics(): Promise<string> {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const mongoUp = this.mongoConnection?.readyState === 1 ? 1 : 0;

    let redisUp = 0;
    try {
      const pong = await this.redisService.getClient().ping();
      if (pong === 'PONG') redisUp = 1;
    } catch {
      redisUp = 0;
    }

    return [
      '# HELP process_resident_memory_bytes Resident memory size in bytes.',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${memory.rss}`,
      '# HELP nodejs_heap_size_used_bytes Process heap size used in bytes.',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${memory.heapUsed}`,
      '# HELP nodejs_heap_size_total_bytes Process heap size total in bytes.',
      '# TYPE nodejs_heap_size_total_bytes gauge',
      `nodejs_heap_size_total_bytes ${memory.heapTotal}`,
      '# HELP process_uptime_seconds Process uptime in seconds.',
      '# TYPE process_uptime_seconds counter',
      `process_uptime_seconds ${uptime.toFixed(2)}`,
      '# HELP shikkhok_mongodb_connected Status of MongoDB connection (1 = up, 0 = down).',
      '# TYPE shikkhok_mongodb_connected gauge',
      `shikkhok_mongodb_connected ${mongoUp}`,
      '# HELP shikkhok_redis_connected Status of Redis connection (1 = up, 0 = down).',
      '# TYPE shikkhok_redis_connected gauge',
      `shikkhok_redis_connected ${redisUp}`,
    ].join('\n');
  }
}
