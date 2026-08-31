import dotenv from 'dotenv';
dotenv.config();

export const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiHmacSecret: process.env.AI_GATEWAY_HMAC_SECRET || 'dev_ai_gateway_secret_key_123456789',
  fcmServerKey: process.env.FCM_SERVER_KEY || 'mock',
  nodeEnv: process.env.NODE_ENV || 'development',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
};
