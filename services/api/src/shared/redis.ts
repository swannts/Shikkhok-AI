import Redis from 'ioredis';
import { env } from './config/env';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  connectTimeout: 500,
});

redis.on('error', () => {
  // Silent fallback to memory store when Redis container is offline
});
