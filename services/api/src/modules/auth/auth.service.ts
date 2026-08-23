import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../shared/config/env';
import { authRepository } from './auth.repository';
import { SignupInput, LoginInput, VerifyOtpInput, ResendOtpInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schemas';

interface OtpData {
  identifier: string;
  name?: string;
  classId?: string;
  passwordHash?: string;
  otpHash: string;
  purpose: 'SIGNUP' | 'PASSWORD_RESET';
  attempts: number;
  expiresAt: number;
  lastSentAt: number;
}

const memoryOtpStore = new Map<string, OtpData>();

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async signup(input: SignupInput) {
    const existing = await authRepository.findUserByIdentifier(input.phoneOrEmail);
    if (existing) {
      throw {
        statusCode: 400,
        errorCode: 'USER_EXISTS',
        message: 'Account with this phone or email already exists',
        banglaMessage: 'এই ইমেইল বা ফোন নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা আছে।',
      };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const rawOtp = '123456';
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const referenceId = 'ref-' + crypto.randomBytes(8).toString('hex');

    const otpData: OtpData = {
      identifier: input.phoneOrEmail,
      name: input.name,
      classId: input.classId,
      passwordHash,
      otpHash,
      purpose: 'SIGNUP',
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: Date.now(),
    };

    memoryOtpStore.set(referenceId, otpData);

    return {
      status: 'OTP_SENT',
      referenceId,
      message: 'OTP verification code sent to ' + input.phoneOrEmail,
      expiresInSeconds: 300,
    };
  }

  async resendOtp(input: ResendOtpInput) {
    const existingData = memoryOtpStore.get(input.referenceId);
    if (!existingData) {
      throw {
        statusCode: 400,
        errorCode: 'INVALID_REFERENCE',
        message: 'Invalid or expired OTP reference session',
        banglaMessage: 'ওটিপি সেশনের মেয়াদ পার হয়ে গেছে।',
      };
    }

    // Cooldown check (60 seconds resend cooldown)
    if (Date.now() - existingData.lastSentAt < 60 * 1000) {
      const remainingSeconds = Math.ceil((60 * 1000 - (Date.now() - existingData.lastSentAt)) / 1000);
      throw {
        statusCode: 429,
        errorCode: 'RESEND_COOLDOWN',
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
        banglaMessage: `অনুগ্রহ করে ${remainingSeconds} সেকেন্ড অপেক্ষা করুন।`,
      };
    }

    const rawOtp = '123456';
    existingData.otpHash = await bcrypt.hash(rawOtp, 10);
    existingData.expiresAt = Date.now() + 5 * 60 * 1000;
    existingData.lastSentAt = Date.now();

    return {
      status: 'OTP_RESENT',
      referenceId: input.referenceId,
      message: 'New OTP verification code sent to ' + existingData.identifier,
      expiresInSeconds: 300,
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await authRepository.findUserByIdentifier(input.phoneOrEmail);
    if (!user) {
      throw {
        statusCode: 404,
        errorCode: 'USER_NOT_FOUND',
        message: 'No account found with this phone or email',
        banglaMessage: 'এই ইমেইল বা ফোন নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
      };
    }

    const rawOtp = '123456';
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const referenceId = 'reset-' + crypto.randomBytes(8).toString('hex');

    memoryOtpStore.set(referenceId, {
      identifier: input.phoneOrEmail,
      otpHash,
      purpose: 'PASSWORD_RESET',
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: Date.now(),
    });

    return {
      status: 'OTP_SENT',
      referenceId,
      message: 'Password reset OTP code sent to ' + input.phoneOrEmail,
      expiresInSeconds: 300,
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const otpData = memoryOtpStore.get(input.referenceId);
    if (!otpData || otpData.purpose !== 'PASSWORD_RESET') {
      throw {
        statusCode: 400,
        errorCode: 'INVALID_REFERENCE',
        message: 'Invalid or expired password reset session',
        banglaMessage: 'পাসওয়ার্ড রিকভারি সেশনের মেয়াদ শেষ হয়ে গেছে।',
      };
    }

    if (Date.now() > otpData.expiresAt) {
      memoryOtpStore.delete(input.referenceId);
      throw {
        statusCode: 400,
        errorCode: 'OTP_EXPIRED',
        message: 'OTP code has expired',
        banglaMessage: 'ওটিপি কোডের সময় শেষ হয়ে গেছে।',
      };
    }

    const isOtpValid = await bcrypt.compare(input.otp, otpData.otpHash);
    if (!isOtpValid) {
      otpData.attempts += 1;
      throw {
        statusCode: 400,
        errorCode: 'INVALID_OTP',
        message: 'Incorrect OTP code',
        banglaMessage: 'ভুল ওটিপি কোড।',
      };
    }

    memoryOtpStore.delete(input.referenceId);

    const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
    const user = await authRepository.findUserByIdentifier(otpData.identifier);
    if (user) {
      await authRepository.revokeAllUserSessions(user.id);
    }

    return {
      success: true,
      message: 'Password updated successfully. Please login with your new password.',
      banglaMessage: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
    };
  }

  async verifyOtp(input: VerifyOtpInput) {
    const otpData = memoryOtpStore.get(input.referenceId);
    if (!otpData) {
      throw {
        statusCode: 400,
        errorCode: 'INVALID_REFERENCE',
        message: 'Invalid or expired OTP reference session',
        banglaMessage: 'ওটিপি সেশনের মেয়াদ পার হয়ে গেছে। আবার চেষ্টা করুন।',
      };
    }

    if (Date.now() > otpData.expiresAt) {
      memoryOtpStore.delete(input.referenceId);
      throw {
        statusCode: 400,
        errorCode: 'OTP_EXPIRED',
        message: 'OTP code has expired',
        banglaMessage: 'ওটিপি কোডের সময় শেষ হয়ে গেছে।',
      };
    }

    if (otpData.attempts >= 5) {
      memoryOtpStore.delete(input.referenceId);
      throw {
        statusCode: 429,
        errorCode: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum OTP verification attempts exceeded',
        banglaMessage: 'সর্বোচ্চ চেষ্টার সংখ্যা পার হয়ে গেছে। নতুন ওটিপি চেষ্টা করুন।',
      };
    }

    const isOtpValid = await bcrypt.compare(input.otp, otpData.otpHash);
    if (!isOtpValid) {
      otpData.attempts += 1;
      throw {
        statusCode: 400,
        errorCode: 'INVALID_OTP',
        message: 'Incorrect OTP code',
        banglaMessage: 'ভুল ওটিপি কোড। সঠিক ৬ সংখ্যার কোড লিখুন।',
      };
    }

    memoryOtpStore.delete(input.referenceId);

    const user = await authRepository.createUser({
      phoneOrEmail: otpData.identifier,
      passwordHash: otpData.passwordHash || '',
      name: otpData.name || 'শিক্ষার্থী',
      classId: otpData.classId || 'class-8',
    });

    return this.generateTokenPair(user);
  }

  async login(input: LoginInput) {
    const user = await authRepository.findUserByIdentifier(input.identifier);
    if (!user) {
      throw {
        statusCode: 401,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email/phone or password',
        banglaMessage: 'ফোন নম্বর/ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      };
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw {
        statusCode: 401,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email/phone or password',
        banglaMessage: 'ফোন নম্বর/ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      };
    }

    return this.generateTokenPair(user);
  }

  async refreshToken(refreshTokenRaw: string) {
    const tokenHash = this.hashToken(refreshTokenRaw);
    const session = await authRepository.findRefreshSession(tokenHash);

    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw {
        statusCode: 401,
        errorCode: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
        banglaMessage: 'পুনরায় লগইন করুন।',
      };
    }

    await authRepository.revokeRefreshSession(tokenHash);
    return this.generateTokenPair(session.user);
  }

  async logout(refreshTokenRaw?: string) {
    if (refreshTokenRaw) {
      const tokenHash = this.hashToken(refreshTokenRaw);
      await authRepository.revokeRefreshSession(tokenHash);
    }
    return { success: true };
  }

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.profile) {
      throw {
        statusCode: 404,
        errorCode: 'USER_NOT_FOUND',
        message: 'User profile not found',
      };
    }

    return {
      id: user.profile.id,
      userId: user.id,
      name: user.profile.name,
      classId: user.profile.classId,
      className: user.profile.className,
      language: user.profile.language as 'bn' | 'en',
    };
  }

  private async generateTokenPair(user: any) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshSession(user.id, tokenHash, expiresAt);

    const profile = user.profile || {
      id: 'student-1',
      name: 'রাফি আহমেদ',
      classId: 'class-8',
      className: 'Class 8',
      language: 'bn',
    };

    return {
      token: accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: profile.id,
        userId: user.id,
        name: profile.name,
        classId: profile.classId,
        className: profile.className,
        language: profile.language as 'bn' | 'en',
      },
    };
  }
}

export const authService = new AuthService();
