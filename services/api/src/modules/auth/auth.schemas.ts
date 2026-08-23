import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  phoneOrEmail: z.string().min(5, 'ইমেইল বা ফোন নম্বর প্রদান করুন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  classId: z.string().default('class-8'),
});

export const verifyOtpSchema = z.object({
  referenceId: z.string().min(1, 'রেফারেন্স আইডি প্রয়োজন'),
  otp: z.string().length(6, '৬ সংখ্যার ওটিপি কোড প্রদান করুন'),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'ইমেইল বা ফোন নম্বর প্রদান করুন'),
  password: z.string().min(6, 'পাসওয়ার্ড প্রদান করুন'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'রিফ্রেশ টোকেন প্রদান করুন'),
});

export const resendOtpSchema = z.object({
  referenceId: z.string().min(1, 'রেফারেন্স আইডি প্রয়োজন'),
});

export const forgotPasswordSchema = z.object({
  phoneOrEmail: z.string().min(5, 'ইমেইল বা ফোন নম্বর প্রদান করুন'),
});

export const resetPasswordSchema = z.object({
  referenceId: z.string().min(1, 'রেফারেন্স আইডি প্রয়োজন'),
  otp: z.string().length(6, '৬ সংখ্যার ওটিপি কোড প্রদান করুন'),
  newPassword: z.string().min(6, 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
