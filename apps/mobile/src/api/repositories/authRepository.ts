import { IAuthRepository } from './interfaces/IRepositories';
import { StudentProfile } from '../../store/useAuthStore';

export interface LoginParams {
  identifier: string;
  password: string;
}

export interface SignupParams {
  name: string;
  phoneOrEmail: string;
  password: string;
  classId: string;
}

class MockAuthRepository implements IAuthRepository {
  async login(_params: LoginParams): Promise<{ token: string; refreshToken?: string; user: StudentProfile }> {
    return {
      token: 'mock-jwt-token-123',
      refreshToken: 'mock-refresh-token-123',
      user: {
        id: 'student-1',
        name: 'রাফি আহমেদ',
        classId: 'class-8',
        className: 'Class 8',
        language: 'bn',
      },
    };
  }

  async signup(_params: SignupParams): Promise<{ status: string; referenceId?: string }> {
    return {
      status: 'OTP_SENT',
      referenceId: 'mock-ref-123',
    };
  }

  async verifyOtp(_referenceId: string, _otp: string): Promise<{ token: string; refreshToken?: string; user: StudentProfile }> {
    return {
      token: 'mock-jwt-token-123',
      refreshToken: 'mock-refresh-token-123',
      user: {
        id: 'student-1',
        name: 'রাফি আহমেদ',
        classId: 'class-8',
        className: 'Class 8',
        language: 'bn',
      },
    };
  }

  async getCurrentUser(): Promise<StudentProfile> {
    return {
      id: 'student-1',
      name: 'রাফি আহমেদ',
      classId: 'class-8',
      className: 'Class 8',
      language: 'bn',
    };
  }

  async refreshToken(_refreshToken: string): Promise<{ token: string; refreshToken?: string }> {
    return {
      token: 'mock-refreshed-jwt-token-456',
      refreshToken: 'mock-refreshed-refresh-token-456',
    };
  }

  async logout(): Promise<void> {
    return;
  }

  async updateProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const current = await this.getCurrentUser();
    return { ...current, ...updates };
  }
}

export const authRepository = new MockAuthRepository();
