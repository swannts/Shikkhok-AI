import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import { randomBytes, createHash } from 'crypto';

import { UserRepository } from '../users/repositories/user.repository';
import { RefreshSessionRepository } from './repositories/refresh-session.repository';
import { RedisService } from '../../core/redis/redis.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { PublicRegistrationRole } from './enums/public-registration-role.enum';

// OTP configuration constants
const OTP_TTL_SECONDS = 300;       // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60;   // 1 minute between resends
const PASSWORD_RESET_TTL = 900;    // 15 minutes

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface OtpState {
  hashedOtp: string;
  phone: string;
  purpose: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  // ──────────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ user: any; tokens: TokenPair }> {
    // Validate: at least one contact method must be provided
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('At least one of email or phone must be provided');
    }

    // Check for existing user by email
    if (dto.email) {
      const existingByEmail = await this.userRepository.findByEmail(dto.email);
      if (existingByEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Check for existing user by phone
    if (dto.phone) {
      const existingByPhone = await this.userRepository.findByPhone(dto.phone);
      if (existingByPhone) {
        throw new ConflictException('A user with this phone number already exists');
      }
    }

    // Hash password with argon2 (OWASP recommended)
    const passwordHash = await argon2.hash(dto.password);

    const user = await this.userRepository.createUser({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: this.mapPublicRegistrationRole(dto.role),
    });

    const tokens = await this.issueTokenPair(user._id.toString(), user.role);

    this.logger.log(`User registered: ${user._id}`, 'AuthService');

    // Return user JSON (passwordHash stripped by schema transform)
    return { user: user.toJSON(), tokens };
  }

  // ──────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────

  async login(dto: LoginDto): Promise<{ user: any; tokens: TokenPair }> {
    // Look up user by email or phone
    const user = dto.identifier.includes('@')
      ? await this.userRepository.findByEmail(dto.identifier)
      : await this.userRepository.findByPhone(dto.identifier);

    if (!user) {
      // Security: do not reveal whether identifier exists
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active. Please contact support.');
    }

    // Verify password
    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokenPair(
      user._id.toString(),
      user.role,
      dto.deviceId,
      dto.deviceName,
    );

    this.logger.log(`User logged in: ${user._id}`, 'AuthService');

    return { user: user.toJSON(), tokens };
  }

  // ──────────────────────────────────────────────
  // REFRESH TOKEN ROTATION
  // ──────────────────────────────────────────────

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    // Decode the refresh token (verify with refresh secret)
    let payload: { sub: string; sessionId: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Find the active session
    const session = await this.refreshSessionRepository.findActiveById(
      payload.sessionId,
      payload.sub,
    );

    if (!session) {
      // Session was revoked or does not exist — possible token reuse attack
      this.logger.warn(
        `Refresh token reuse detected for user ${payload.sub}, session ${payload.sessionId}`,
        'AuthService',
      );
      // Revoke all sessions for this user as a security measure
      await this.refreshSessionRepository.revokeAllByUserId(payload.sub);
      throw new UnauthorizedException('Refresh token has been revoked. Please login again.');
    }

    // Verify token hash matches what's stored
    const tokenHash = this.hashToken(dto.refreshToken);
    if (tokenHash !== session.tokenHash) {
      // Hash mismatch — token reuse detected
      await this.refreshSessionRepository.revokeAllByUserId(payload.sub);
      throw new UnauthorizedException('Refresh token integrity check failed. All sessions revoked.');
    }

    // Revoke the old session
    await this.refreshSessionRepository.revokeSession(session._id.toString());

    // Look up user to get current role (in case role changed)
    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is no longer active');
    }

    // Issue new token pair
    const tokens = await this.issueTokenPair(
      user._id.toString(),
      user.role,
      session.deviceId,
      session.deviceName,
    );

    this.logger.log(`Tokens refreshed for user: ${user._id}`, 'AuthService');

    return tokens;
  }

  // ──────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────

  async logout(sessionId: string, userId: string): Promise<void> {
    await this.refreshSessionRepository.revokeSession(sessionId);
    this.logger.log(`Session ${sessionId} revoked for user ${userId}`, 'AuthService');
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshSessionRepository.revokeAllByUserId(userId);
    this.logger.log(`All sessions revoked for user ${userId}`, 'AuthService');
  }

  // ──────────────────────────────────────────────
  // GET PROFILE
  // ──────────────────────────────────────────────

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toJSON();
  }

  // ──────────────────────────────────────────────
  // OTP (via Redis)
  // ──────────────────────────────────────────────

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const redisKey = `otp:${dto.purpose}:${dto.phone}`;
    const cooldownKey = `otp_cooldown:${dto.purpose}:${dto.phone}`;

    // Check cooldown
    const cooldownExists = await this.redisService.get(cooldownKey);
    if (cooldownExists) {
      throw new BadRequestException(
        'Please wait before requesting a new OTP. Try again in 60 seconds.',
      );
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();
    const hashedOtp = this.hashToken(otp);

    const otpState: OtpState = {
      hashedOtp,
      phone: dto.phone,
      purpose: dto.purpose,
      attempts: 0,
      createdAt: Date.now(),
    };

    // Store OTP state in Redis with TTL
    await this.redisService.set(redisKey, JSON.stringify(otpState), OTP_TTL_SECONDS);

    // Set cooldown to prevent rapid resend
    await this.redisService.set(cooldownKey, '1', OTP_COOLDOWN_SECONDS);

    // In production: send OTP via SMS gateway
    // For development: log for testing (OTP is never logged in production)
    if (this.configService.get<string>('environment') === 'development') {
      this.logger.debug(`[DEV ONLY] OTP for ${dto.phone}: ${otp}`, 'AuthService');
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const redisKey = `otp:${dto.purpose}:${dto.phone}`;

    const raw = await this.redisService.get(redisKey);
    if (!raw) {
      throw new BadRequestException('OTP has expired or was not requested');
    }

    const otpState: OtpState = JSON.parse(raw);

    // Check max attempts
    if (otpState.attempts >= OTP_MAX_ATTEMPTS) {
      await this.redisService.del(redisKey);
      throw new BadRequestException('Maximum OTP attempts exceeded. Please request a new OTP.');
    }

    // Verify OTP hash
    const hashedInput = this.hashToken(dto.otp);
    if (hashedInput !== otpState.hashedOtp) {
      // Increment attempts and update Redis
      otpState.attempts += 1;
      const remainingTtl = OTP_TTL_SECONDS - Math.floor((Date.now() - otpState.createdAt) / 1000);
      if (remainingTtl > 0) {
        await this.redisService.set(redisKey, JSON.stringify(otpState), remainingTtl);
      }
      throw new BadRequestException(
        `Invalid OTP. ${OTP_MAX_ATTEMPTS - otpState.attempts} attempts remaining.`,
      );
    }

    // OTP is valid — delete it from Redis
    await this.redisService.del(redisKey);

    return { verified: true };
  }

  // ──────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ──────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = dto.identifier.includes('@')
      ? await this.userRepository.findByEmail(dto.identifier)
      : await this.userRepository.findByPhone(dto.identifier);

    // Security: always return success to prevent user enumeration
    if (!user) {
      return { message: 'If the account exists, a password reset link has been sent.' };
    }

    // Generate a secure random reset token
    const resetToken = randomBytes(32).toString('hex');
    const redisKey = `password_reset:${resetToken}`;

    await this.redisService.set(redisKey, user._id.toString(), PASSWORD_RESET_TTL);

    // In production: send via email/SMS
    if (this.configService.get<string>('environment') === 'development') {
      this.logger.debug(`[DEV ONLY] Password reset token for ${user._id}: ${resetToken}`, 'AuthService');
    }

    return { message: 'If the account exists, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const redisKey = `password_reset:${dto.token}`;
    const userId = await this.redisService.get(redisKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash new password
    const passwordHash = await argon2.hash(dto.newPassword);

    // Update user password
    await this.userRepository.updatePasswordHash(userId, passwordHash);

    // Delete used token
    await this.redisService.del(redisKey);

    // Revoke all refresh sessions (force re-login on all devices)
    await this.refreshSessionRepository.revokeAllByUserId(userId);

    this.logger.log(`Password reset completed for user: ${userId}`, 'AuthService');

    return { message: 'Password has been reset successfully. Please login with your new password.' };
  }

  // ──────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────

  /**
   * Issue an access + refresh token pair and persist the refresh session.
   */
  private async issueTokenPair(
    userId: string,
    role: string,
    deviceId?: string,
    deviceName?: string,
  ): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      { sub: userId, role },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessTtl', '15m') as any,
      },
    );

    // Compute refresh token expiry
    const refreshTtl = this.configService.get<string>('jwt.refreshTtl', '7d');
    const expiresAt = this.computeExpiryDate(refreshTtl);

    // Generate session ID first, then sign refresh token with sessionId in payload
    const sessionDoc = await this.refreshSessionRepository.createSession({
      userId: new Types.ObjectId(userId),
      tokenHash: '', // Placeholder — will be updated after signing
      deviceId,
      deviceName,
      expiresAt,
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, sessionId: sessionDoc._id.toString() },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl as any,
      },
    );

    // Store the hash of the refresh token (never the raw token)
    sessionDoc.tokenHash = this.hashToken(refreshToken);
    await sessionDoc.save();

    return { accessToken, refreshToken };
  }

  private mapPublicRegistrationRole(role?: PublicRegistrationRole): UserRole {
    switch (role ?? PublicRegistrationRole.STUDENT) {
      case PublicRegistrationRole.STUDENT:
        return UserRole.STUDENT;
      case PublicRegistrationRole.PARENT:
        return UserRole.PARENT;
      default:
        throw new BadRequestException('Public registration only allows student or parent accounts');
    }
  }

  /**
   * SHA-256 hash for token comparison. Not for passwords — use argon2 for those.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a cryptographically secure 6-digit OTP.
   */
  private generateOtp(): string {
    const buffer = randomBytes(3);
    const num = buffer.readUIntBE(0, 3) % 1000000;
    return num.toString().padStart(6, '0');
  }

  /**
   * Parse duration string (e.g., '7d', '15m', '1h') into a Date.
   */
  private computeExpiryDate(ttl: string): Date {
    const now = new Date();
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days if TTL format is unrecognized
      now.setDate(now.getDate() + 7);
      return now;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': now.setSeconds(now.getSeconds() + value); break;
      case 'm': now.setMinutes(now.getMinutes() + value); break;
      case 'h': now.setHours(now.getHours() + value); break;
      case 'd': now.setDate(now.getDate() + value); break;
    }

    return now;
  }
}
