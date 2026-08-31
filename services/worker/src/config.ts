import dotenv from 'dotenv';
dotenv.config();

export const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiHmacSecret: process.env.AI_GATEWAY_HMAC_SECRET || 'dev_ai_gateway_secret_key_123456789',
  nodeEnv: process.env.NODE_ENV || 'development',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),

  // Push Notifications (Firebase Cloud Messaging)
  fcmServerKey: process.env.FCM_SERVER_KEY || 'mock',
  fcmProjectId: process.env.FCM_PROJECT_ID || 'shikkhok-ai-prod',

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
};
