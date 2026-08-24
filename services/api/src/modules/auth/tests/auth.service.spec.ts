import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import * as crypto from 'crypto';

import { AuthService } from '../auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { RefreshSessionRepository } from '../repositories/refresh-session.repository';
import { RedisService } from '../../../core/redis/redis.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { PublicRegistrationRole } from '../enums/public-registration-role.enum';

// ─────────────────────────────────────────────────
// Fake implementations (not mocking every internal)
// ─────────────────────────────────────────────────

function createFakeUser(overrides: any = {}) {
  const userId = new Types.ObjectId();
  return {
    _id: userId,
    name: 'Test User',
    email: 'test@example.com',
    phone: '+8801712345678',
    passwordHash: 'hashed_password',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        role: this.role,
        status: this.status,
      };
    },
    ...overrides,
  };
}

function createFakeSession(overrides: any = {}) {
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    tokenHash: 'fake_hash',
    deviceId: 'device-123',
    deviceName: 'Test Device',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let refreshSessionRepository: jest.Mocked<RefreshSessionRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            createUser: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            updateStatus: jest.fn(),
            updatePasswordHash: jest.fn(),
          },
        },
        {
          provide: RefreshSessionRepository,
          useValue: {
            createSession: jest.fn(),
            findActiveById: jest.fn(),
            revokeSession: jest.fn(),
            revokeAllByUserId: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, string> = {
                'jwt.accessSecret': 'test-access-secret-at-least-32-chars-123456',
                'jwt.refreshSecret': 'test-refresh-secret-at-least-32-chars-123456',
                'jwt.accessTtl': '15m',
                'jwt.refreshTtl': '7d',
                environment: 'test',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    refreshSessionRepository = module.get(RefreshSessionRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    redisService = module.get(RedisService);
  });

  // ──────────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────────

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      const fakeUser = createFakeUser();
      const fakeSession = createFakeSession({ userId: fakeUser._id });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(fakeUser as any);
      refreshSessionRepository.createSession.mockResolvedValue(fakeSession as any);

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        phone: '01712345678',
        password: 'SecureP@ss123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe('Test User');
      // Security: passwordHash must not appear in returned user
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // Verify argon2 hash was passed (not raw password)
      const createCall = userRepository.createUser.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe('SecureP@ss123');
    });

    it('should allow student public registration', async () => {
      const fakeUser = createFakeUser({ role: UserRole.STUDENT });
      const fakeSession = createFakeSession({ userId: fakeUser._id });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(fakeUser as any);
      refreshSessionRepository.createSession.mockResolvedValue(fakeSession as any);

      await authService.register({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'SecureP@ss123',
        role: PublicRegistrationRole.STUDENT,
      });

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.STUDENT }),
      );
    });

    it('should allow parent public registration', async () => {
      const fakeUser = createFakeUser({ role: UserRole.PARENT });
      const fakeSession = createFakeSession({ userId: fakeUser._id });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(fakeUser as any);
      refreshSessionRepository.createSession.mockResolvedValue(fakeSession as any);

      await authService.register({
        name: 'Test Parent',
        email: 'parent@example.com',
        password: 'SecureP@ss123',
        role: PublicRegistrationRole.PARENT,
      });

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PARENT }),
      );
    });

    it('should reject elevated roles through public registration', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);

      await expect(
        authService.register({
          name: 'Malicious User',
          email: 'admin@example.com',
          password: 'SecureP@ss123',
          role: 'admin' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if neither email nor phone is provided', async () => {
      await expect(
        authService.register({
          name: 'Test User',
          password: 'SecureP@ss123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(createFakeUser() as any);

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecureP@ss123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject registration if phone already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(createFakeUser() as any);

      await expect(
        authService.register({
          name: 'Test User',
          email: 'new@example.com',
          phone: '01712345678',
          password: 'SecureP@ss123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ──────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────

  describe('login', () => {
    it('should return user and tokens for valid credentials', async () => {
      const passwordHash = await argon2.hash('SecureP@ss123');
      const fakeUser = createFakeUser({ passwordHash });
      const fakeSession = createFakeSession({ userId: fakeUser._id });

      userRepository.findByEmail.mockResolvedValue(fakeUser as any);
      refreshSessionRepository.createSession.mockResolvedValue(fakeSession as any);

      const result = await authService.login({
        identifier: 'test@example.com',
        password: 'SecureP@ss123',
      });

      expect(result.user).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await argon2.hash('CorrectPassword');
      const fakeUser = createFakeUser({ passwordHash });

      userRepository.findByEmail.mockResolvedValue(fakeUser as any);

      await expect(
        authService.login({
          identifier: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          identifier: 'unknown@example.com',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for suspended accounts', async () => {
      const passwordHash = await argon2.hash('SecureP@ss123');
      const fakeUser = createFakeUser({ passwordHash, status: UserStatus.SUSPENDED });

      userRepository.findByEmail.mockResolvedValue(fakeUser as any);

      await expect(
        authService.login({
          identifier: 'test@example.com',
          password: 'SecureP@ss123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────
  // REFRESH TOKEN ROTATION
  // ──────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should issue new token pair on valid refresh', async () => {
      const userId = new Types.ObjectId().toString();
      const sessionId = new Types.ObjectId().toString();

      jwtService.verify.mockReturnValue({ sub: userId, sessionId });

      // The service will hash the incoming refreshToken and compare
      // We need the session's tokenHash to match
      const fakeSession = createFakeSession({
        _id: sessionId,
        userId: new Types.ObjectId(userId),
      });
      // Override tokenHash after we know what token the service will hash
      // For this test, we make findActiveById return the session and let the hash check work
      // by setting a matching tokenHash
      const tokenHash = crypto.createHash('sha256').update('valid.refresh.token').digest('hex');
      fakeSession.tokenHash = tokenHash;

      refreshSessionRepository.findActiveById.mockResolvedValue(fakeSession as any);
      const fakeUser = createFakeUser({ _id: new Types.ObjectId(userId) });
      userRepository.findById.mockResolvedValue(fakeUser as any);

      const newSession = createFakeSession({ userId: new Types.ObjectId(userId) });
      refreshSessionRepository.createSession.mockResolvedValue(newSession as any);

      const result = await authService.refreshTokens({
        refreshToken: 'valid.refresh.token',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Old session should be revoked
      expect(refreshSessionRepository.revokeSession).toHaveBeenCalledWith(sessionId);
    });

    it('should revoke all sessions on token reuse (no active session found)', async () => {
      const userId = new Types.ObjectId().toString();
      const sessionId = new Types.ObjectId().toString();

      jwtService.verify.mockReturnValue({ sub: userId, sessionId });
      refreshSessionRepository.findActiveById.mockResolvedValue(null);

      await expect(authService.refreshTokens({ refreshToken: 'reused.token' })).rejects.toThrow(
        UnauthorizedException,
      );

      // Security: all sessions should be revoked on reuse detection
      expect(refreshSessionRepository.revokeAllByUserId).toHaveBeenCalledWith(userId);
    });

    it('should reject expired refresh tokens', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refreshTokens({ refreshToken: 'expired.token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke a single session', async () => {
      const sessionId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      await authService.logout(sessionId, userId);

      expect(refreshSessionRepository.revokeSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions for a user', async () => {
      const userId = new Types.ObjectId().toString();

      await authService.logoutAll(userId);

      expect(refreshSessionRepository.revokeAllByUserId).toHaveBeenCalledWith(userId);
    });
  });

  // ──────────────────────────────────────────────
  // OTP
  // ──────────────────────────────────────────────

  describe('requestOtp', () => {
    it('should store OTP in Redis and return success', async () => {
      redisService.get.mockResolvedValue(null); // No cooldown

      const result = await authService.requestOtp({
        phone: '01712345678',
        purpose: 'registration' as any,
      });

      expect(result.message).toBe('OTP sent successfully');
      expect(redisService.set).toHaveBeenCalledTimes(2); // OTP state + cooldown
    });

    it('should reject OTP request during cooldown period', async () => {
      redisService.get.mockResolvedValue('1'); // Cooldown active

      await expect(
        authService.requestOtp({
          phone: '01712345678',
          purpose: 'registration' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify correct OTP and delete from Redis', async () => {
      const hashedOtp = crypto.createHash('sha256').update('123456').digest('hex');

      const otpState = JSON.stringify({
        hashedOtp,
        phone: '01712345678',
        purpose: 'registration',
        attempts: 0,
        createdAt: Date.now(),
      });

      redisService.get.mockResolvedValue(otpState);

      const result = await authService.verifyOtp({
        phone: '01712345678',
        otp: '123456',
        purpose: 'registration' as any,
      });

      expect(result.verified).toBe(true);
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should reject incorrect OTP and increment attempts', async () => {
      const hashedOtp = crypto.createHash('sha256').update('123456').digest('hex');

      const otpState = JSON.stringify({
        hashedOtp,
        phone: '01712345678',
        purpose: 'registration',
        attempts: 0,
        createdAt: Date.now(),
      });

      redisService.get.mockResolvedValue(otpState);

      await expect(
        authService.verifyOtp({
          phone: '01712345678',
          otp: '999999', // Wrong OTP
          purpose: 'registration' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      // Should update Redis with incremented attempts
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should reject when OTP has expired (not in Redis)', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(
        authService.verifyOtp({
          phone: '01712345678',
          otp: '123456',
          purpose: 'registration' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when max attempts exceeded', async () => {
      const otpState = JSON.stringify({
        hashedOtp: 'any_hash',
        phone: '01712345678',
        purpose: 'registration',
        attempts: 5, // Already at max
        createdAt: Date.now(),
      });

      redisService.get.mockResolvedValue(otpState);

      await expect(
        authService.verifyOtp({
          phone: '01712345678',
          otp: '123456',
          purpose: 'registration' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      // OTP should be deleted after max attempts
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ──────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should always return success message (prevents user enumeration)', async () => {
      userRepository.findByEmail.mockResolvedValue(null); // User doesn't exist

      const result = await authService.forgotPassword({
        identifier: 'unknown@example.com',
      });

      // Should NOT reveal that the user doesn't exist
      expect(result.message).toContain('If the account exists');
    });

    it('should store reset token in Redis when user exists', async () => {
      const fakeUser = createFakeUser();
      userRepository.findByEmail.mockResolvedValue(fakeUser as any);

      await authService.forgotPassword({
        identifier: 'test@example.com',
      });

      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password and revoke all sessions', async () => {
      const userId = new Types.ObjectId().toString();
      redisService.get.mockResolvedValue(userId);

      const result = await authService.resetPassword({
        token: 'valid_reset_token',
        newPassword: 'NewSecureP@ss456',
      });

      expect(result.message).toContain('reset successfully');
      expect(userRepository.updatePasswordHash).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalled();
      expect(refreshSessionRepository.revokeAllByUserId).toHaveBeenCalledWith(userId);
    });

    it('should reject invalid/expired reset token', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'invalid_token',
          newPassword: 'NewPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
