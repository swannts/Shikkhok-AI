export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://shikkhok_admin:shikkhok_secure_password@localhost:27017/shikkhok_db?authSource=admin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'shikkhok-development-only-access-secret-2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'shikkhok-development-only-refresh-secret-2026',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:4000,http://localhost:8081')
      .split(',')
      .map((origin) => origin.trim()),
  },
});
