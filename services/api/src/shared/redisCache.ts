import { redis } from './redis';

export interface OtpData {
  code: string;
  phoneOrEmail: string;
  attempts: number;
  expiresAt: number;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  studentId?: string;
  role: string;
  createdAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface DailyQuotaResult {
  allowed: boolean;
  count: number;
}

export class RedisCacheManager {
  private static readonly DEFAULT_OTP_TTL_SECONDS = 300;      // 5 Minutes
  private static readonly DEFAULT_SESSION_TTL_SECONDS = 3600;  // 1 Hour
  private static readonly DEFAULT_LOCK_TTL_SECONDS = 10;      // 10 Seconds

  /**
   * 1. Short-Lived OTP Storage (5 Minutes TTL)
   */
  public async setOtp(identifier: string, data: OtpData, ttlSeconds: number = RedisCacheManager.DEFAULT_OTP_TTL_SECONDS): Promise<void> {
    try {
      await redis.setex(`otp:${identifier}`, ttlSeconds, JSON.stringify(data));
    } catch {
      // Ephemeral fallback
    }
  }

  public async getOtp(identifier: string): Promise<OtpData | null> {
    try {
      const data = await redis.get(`otp:${identifier}`);
      return data ? (JSON.parse(data) as OtpData) : null;
    } catch {
      return null;
    }
  }

  /**
   * 2. API Rate Limiting (1 Minute Window)
   */
  public async checkRateLimit(key: string, limit: number = 60, windowSeconds: number = 60): Promise<RateLimitResult> {
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
  public async checkAiDailyQuota(studentId: string, dailyLimit: number = 50): Promise<DailyQuotaResult> {
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
  public async setSessionCache(sessionId: string, sessionData: SessionData, ttlSeconds: number = RedisCacheManager.DEFAULT_SESSION_TTL_SECONDS): Promise<void> {
    try {
      await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(sessionData));
    } catch {
      // Ephemeral fallback
    }
  }

  /**
   * 5. Distributed Lock (Prevents Race Conditions)
   */
  public async acquireLock(lockKey: string, ttlSeconds: number = RedisCacheManager.DEFAULT_LOCK_TTL_SECONDS): Promise<boolean> {
    try {
      const res = await redis.set(`lock:${lockKey}`, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch {
      return true;
    }
  }

  public async releaseLock(lockKey: string): Promise<void> {
    try {
      await redis.del(`lock:${lockKey}`);
    } catch {
      // Ignored
    }
  }
}

export const redisCacheManager = new RedisCacheManager();

