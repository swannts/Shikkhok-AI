import dotenv from 'dotenv';
import Redis from 'ioredis';
import { readFileSync } from 'fs';
import { promisify } from 'util';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let _redisClient: Redis | null = null;
if (process.env.NODE_ENV !== 'test') {
  _redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
  _redisClient.on('error', (err: Error) => {
    console.error(`[Worker] Redis connection error: ${err.message}`);
  });
}

function getRedisClient(): Redis {
  if (!_redisClient) {
    _redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
    _redisClient.on('error', (err: Error) => {
      console.error(`[Worker] Redis connection error: ${err.message}`);
    });
  }
  return _redisClient;
}

const pingAsync = _redisClient ? promisify(_redisClient.ping.bind(_redisClient)) : async () => 'PONG';

export const config = {
  redisUrl,
  getRedisClient: getRedisClient,
  pingRedis: async (): Promise<boolean> => {
    try {
      const client = getRedisClient();
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  },

  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiHmacSecret: process.env.AI_HMAC_SECRET || process.env.AI_GATEWAY_HMAC_SECRET || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),

  healthPort: parseInt(process.env.WORKER_HEALTH_PORT || '3100', 10),

  // FCM HTTP v1 (Firebase service account credentials)
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey:
    (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',

  // Email Transports (Resend / SendGrid)
  resendApiKey: process.env.RESEND_API_KEY || '',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  defaultFromEmail: process.env.DEFAULT_FROM_EMAIL || 'support@shikkhok.ai',

  // SMS Transports (SSL Wireless Bangladesh / Twilio)
  sslWirelessApiToken: process.env.SSL_WIRELESS_API_TOKEN || '',
  sslWirelessSid: process.env.SSL_WIRELESS_SID || '',
  sslWirelessDomain: process.env.SSL_WIRELESS_DOMAIN || 'https://smsplus.sslwireless.com',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },

  get fcmConfigured(): boolean {
    if (this.firebaseServiceAccountPath) {
      try {
        const sa = JSON.parse(readFileSync(this.firebaseServiceAccountPath, 'utf-8'));
        return !!(sa.project_id && sa.client_email && sa.private_key);
      } catch {
        return false;
      }
    }
    return !!(
      this.firebaseProjectId &&
      this.firebaseClientEmail &&
      this.firebasePrivateKey
    );
  },
};

export { _redisClient, pingAsync };
