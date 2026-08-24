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
      },
      timestamp: new Date().toISOString(),
    };
  }
}
