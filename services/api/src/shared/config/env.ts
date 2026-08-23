import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://shikkhok_user:shikkhok_secure_password@localhost:5432/shikkhok_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('shikkhok-production-grade-secure-jwt-secret-key-2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        NODE_ENV: 'development' as const,
        PORT: 4000,
        DATABASE_URL: 'postgresql://shikkhok_user:shikkhok_secure_password@localhost:5432/shikkhok_db?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'shikkhok-production-grade-secure-jwt-secret-key-2026',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
    }
    throw new Error('Invalid environment configuration');
  }
  return result.data;
};

export const env = parseEnv();
