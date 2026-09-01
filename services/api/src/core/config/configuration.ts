export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb://shikkhok_admin:shikkhok_secure_password@localhost:27017/shikkhok_db?authSource=admin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'shikkhok-development-only-access-secret-2026',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'shikkhok-development-only-refresh-secret-2026',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  cors: {
    origins: (
      process.env.CORS_ORIGINS ||
      'http://localhost:3000,http://localhost:4000,http://localhost:8081'
    )
      .split(',')
      .map((origin) => origin.trim()),
  },
  aiGateway: {
    url: process.env.AI_GATEWAY_URL || '',
    timeoutMs: parseInt(process.env.AI_GATEWAY_TIMEOUT_MS || '12000', 10),
  },
  aiService: {
    enabled: process.env.AI_SERVICE_ENABLED === 'true',
    baseUrl: process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000/api/v1',
    secret: process.env.AI_SERVICE_SECRET || process.env.AI_HMAC_SECRET || '',
    hmacSecret: process.env.AI_HMAC_SECRET || process.env.AI_SERVICE_SECRET || '',
    allowedServices: ['nestjs-backend', 'shikkhok-api', 'shikkhok-worker'],
    allowedClockSkewSeconds: parseInt(process.env.ALLOWED_CLOCK_SKEW_SECONDS || '300', 10),
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '25000', 10),
  },
  payments: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'dev-payment-webhook-secret-32chars',
    bkash: {
      appKey: process.env.BKASH_APP_KEY || '',
      appSecret: process.env.BKASH_APP_SECRET || '',
      username: process.env.BKASH_USERNAME || '',
      password: process.env.BKASH_PASSWORD || '',
      baseUrl: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    },
    nagad: {
      merchantId: process.env.NAGAD_MERCHANT_ID || '',
      publicKey: process.env.NAGAD_PUBLIC_KEY || '',
      privateKey: process.env.NAGAD_PRIVATE_KEY || '',
      baseUrl:
        process.env.NAGAD_BASE_URL ||
        'https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
    },
    sslcommerz: {
      storeId: process.env.SSLCOMMERZ_STORE_ID || '',
      storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
      baseUrl: process.env.SSLCOMMERZ_BASE_URL || 'https://sandbox.sslcommerz.com',
    },
  },
});
