import 'reflect-metadata';
import { validateConfig, Environment } from './env.validation';

describe('Environment Variables Validation', () => {
  it('should validate and return typed config when valid environment is provided', () => {
    const rawEnv = {
      NODE_ENV: 'development',
      PORT: '4000',
      MONGODB_URI: 'mongodb://localhost:27017/test_db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'super-secret-access-key-minimum-16-chars',
      JWT_REFRESH_SECRET: 'super-secret-refresh-key-minimum-16-chars',
    };

    const config = validateConfig(rawEnv);
    expect(config.NODE_ENV).toBe(Environment.Development);
    expect(config.PORT).toBe(4000);
    expect(config.MONGODB_URI).toBe('mongodb://localhost:27017/test_db');
  });

  it('should throw error when mandatory MONGODB_URI is missing', () => {
    const rawEnv = {
      NODE_ENV: 'development',
      PORT: '4000',
      MONGODB_URI: '',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'super-secret-access-key-minimum-16-chars',
      JWT_REFRESH_SECRET: 'super-secret-refresh-key-minimum-16-chars',
    };

    expect(() => validateConfig(rawEnv)).toThrow();
  });
});
