import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const UNSAFE_FALLBACK_SECRETS = [
  'default-secret',
  'shikkhok-secret',
  'change-this-in-production',
  'change-me',
  'shikkhok-jwt-production-secret-key',
];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

const parseEnv = () => {
  const currentEnv = process.env.NODE_ENV || 'development';
  const rawJwtSecret = process.env.JWT_SECRET;

  // Strict check for production and staging environments
  if (currentEnv === 'production' || currentEnv === 'staging') {
    if (!rawJwtSecret) {
      throw new Error('❌ [FATAL] JWT_SECRET environment variable is missing. Startup aborted.');
    }
    if (UNSAFE_FALLBACK_SECRETS.includes(rawJwtSecret)) {
      throw new Error('❌ [FATAL] JWT_SECRET uses an unsafe default secret string. Startup aborted.');
    }
  }

  const result = envSchema.safeParse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://shikkhok_user:shikkhok_secure_password@localhost:5432/shikkhok_db?schema=public',
    JWT_SECRET: rawJwtSecret || 'shikkhok-development-only-jwt-secret-key-2026',
  });

  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', result.error.format());
    if (currentEnv === 'production' || currentEnv === 'staging') {
      throw new Error('Invalid environment configuration in production');
    }
    return {
      NODE_ENV: 'development' as const,
      PORT: 4000,
      DATABASE_URL: 'postgresql://shikkhok_user:shikkhok_secure_password@localhost:5432/shikkhok_db?schema=public',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'shikkhok-development-only-jwt-secret-key-2026',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
  }

  return result.data;
};

export const env = parseEnv();
