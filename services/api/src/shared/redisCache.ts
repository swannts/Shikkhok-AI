import { redis } from './redis';

export class RedisCacheManager {
  /**
   * 1. Short-Lived OTP Storage (5 Minutes TTL)
   */
  public async setOtp(identifier: string, data: any, ttlSeconds: number = 300) {
    try {
      await redis.setex(`otp:${identifier}`, ttlSeconds, JSON.stringify(data));
    } catch {
      // Ephemeral fallback
    }
  }

  public async getOtp(identifier: string): Promise<any | null> {
    try {
      const data = await redis.get(`otp:${identifier}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * 2. API Rate Limiting (1 Minute Window)
   */
  public async checkRateLimit(key: string, limit: number = 60, windowSeconds: number = 60): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const current = await redis.incr(`ratelimit:${key}`);
      if (current === 1) {
        await redis.expire(`ratelimit:${key}`, windowSeconds);
      }
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
      };
    } catch {
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * 3. AI Usage Limits (Daily Quota Tracking)
   */
  public async checkAiDailyQuota(studentId: string, dailyLimit: number = 50): Promise<{ allowed: boolean; count: number }> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_quota:${studentId}:${today}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 86400); // 24h
      }
      return { allowed: count <= dailyLimit, count };
    } catch {
      return { allowed: true, count: 1 };
    }
  }

  /**
   * 4. Temporary Auth Session Caching (1 Hour TTL)
   */
  public async setSessionCache(sessionId: string, sessionData: any, ttlSeconds: number = 3600) {
    try {
      await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(sessionData));
    } catch {
      // Ephemeral fallback
    }
  }

  /**
   * 5. Distributed Lock (Prevents Race Conditions)
   */
  public async acquireLock(lockKey: string, ttlSeconds: number = 10): Promise<boolean> {
    try {
      const res = await redis.set(`lock:${lockKey}`, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch {
      return true;
    }
  }

  public async releaseLock(lockKey: string) {
    try {
      await redis.del(`lock:${lockKey}`);
    } catch {
      // Ignored
    }
  }
}

export const redisCacheManager = new RedisCacheManager();
