import { Request, Response, NextFunction } from 'express';
import { redisCacheManager } from './redisCache';

export interface RateLimitOptions {
  limit: number;           // Max allowed requests in window
  windowSeconds: number;   // Window duration in seconds
  keyPrefix: string;       // Scope identifier (e.g. 'login', 'otp_resend')
  customMessage?: string;
  customBanglaMessage?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier =
      (req as any).user?.userId ||
      (req as any).user?.studentId ||
      req.body?.phoneOrEmail ||
      req.body?.email ||
      req.ip ||
      'anonymous';

    const key = `${options.keyPrefix}:${identifier}`;
    const result = await redisCacheManager.checkRateLimit(key, options.limit, options.windowSeconds);

    res.setHeader('X-RateLimit-Limit', options.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      return res.status(429).json({
        statusCode: 429,
        errorCode: 'TOO_MANY_REQUESTS',
        message: options.customMessage || 'Rate limit exceeded. Please try again later.',
        banglaMessage: options.customBanglaMessage || 'অতিরিক্ত অনুরোধ করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।',
        details: {
          limit: options.limit,
          windowSeconds: options.windowSeconds,
        },
      });
    }

    return next();
  };
};

/**
 * Pre-configured Rate Limiters for Sensitive Endpoints
 */
export const rateLimiters = {
  login: createRateLimiter({
    limit: 5,
    windowSeconds: 60,
    keyPrefix: 'auth_login',
    customMessage: 'Too many login attempts. Please try again in a minute.',
    customBanglaMessage: 'অতিরিক্ত লগইন চেষ্টা করা হয়েছে। ১ মিনিট পর আবার চেষ্টা করুন।',
  }),

  signup: createRateLimiter({
    limit: 3,
    windowSeconds: 300,
    keyPrefix: 'auth_signup',
    customMessage: 'Too many signup attempts. Please try again later.',
    customBanglaMessage: 'অতিরিক্ত অ্যাকাউন্ট তৈরির চেষ্টা করা হয়েছে। পরে চেষ্টা করুন।',
  }),

  otpVerify: createRateLimiter({
    limit: 5,
    windowSeconds: 300,
    keyPrefix: 'auth_otp_verify',
    customMessage: 'Too many OTP verification attempts. OTP expired.',
    customBanglaMessage: 'অতিরিক্ত ওটিপি চেষ্টা করা হয়েছে। অনুগ্রহ করে নতুন ওটিপি পাঠান।',
  }),

  otpResend: createRateLimiter({
    limit: 2,
    windowSeconds: 120,
    keyPrefix: 'auth_otp_resend',
    customMessage: 'Please wait before requesting another OTP.',
    customBanglaMessage: 'নতুন ওটিপি পাঠানোর জন্য ২ মিনিট অপেক্ষা করুন।',
  }),

  passwordReset: createRateLimiter({
    limit: 3,
    windowSeconds: 600,
    keyPrefix: 'auth_password_reset',
    customMessage: 'Too many password reset requests.',
    customBanglaMessage: 'অতিরিক্ত পাসওয়ার্ড রিসেট চেষ্টা করা হয়েছে।',
  }),

  aiTutorStream: createRateLimiter({
    limit: 15,
    windowSeconds: 60,
    keyPrefix: 'ai_tutor_stream',
    customMessage: 'AI Tutor rate limit exceeded (15 req/min).',
    customBanglaMessage: 'এআই টিউটরের সাথে কথা বলার হার অতিক্রম করেছে (প্রতি মিনিটে ১৫টি অনুরোধ)।',
  }),
};
