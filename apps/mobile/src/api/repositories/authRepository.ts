import { delay } from '../client';
import { StudentProfile } from '../../store/useAuthStore';

export interface LoginParams {
  identifier: string;
  password?: string;
}

export interface SignupParams {
  fullName: string;
  phoneOrEmail: string;
  password?: string;
}

export const authRepository = {
  login: async (params: LoginParams): Promise<{ token: string; user: StudentProfile }> => {
    await delay(400);
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'student-1',
        name: 'রাফি',
        classId: 'class-8',
        className: 'Class 8',
        language: 'bn',
      },
    };
  },

  signup: async (params: SignupParams): Promise<{ tempToken: string }> => {
    await delay(400);
    return { tempToken: 'temp-token-otp' };
  },

  verifyOTP: async (otp: string): Promise<{ token: string; user: StudentProfile }> => {
    await delay(350);
    return {
      token: 'mock-jwt-token-verified',
      user: {
        id: 'student-1',
        name: 'রাফি',
        classId: 'class-8',
        className: 'Class 8',
        language: 'bn',
      },
    };
  },

  updateProfile: async (updates: Partial<StudentProfile>): Promise<StudentProfile> => {
    await delay(300);
    return {
      id: 'student-1',
      name: updates.name || 'রাফি',
      classId: updates.classId || 'class-8',
      className: updates.className || 'Class 8',
      language: updates.language || 'bn',
    };
  },
};
