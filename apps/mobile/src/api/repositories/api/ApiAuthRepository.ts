import { IAuthRepository } from '../interfaces/IRepositories';
import { LoginParams, SignupParams } from '../authRepository';
import { StudentProfile } from '../../../store/useAuthStore';
import { httpClient } from '../../httpClient';

export class ApiAuthRepository implements IAuthRepository {
  async login(params: LoginParams): Promise<{ token: string; user: StudentProfile }> {
    return httpClient.post<{ token: string; user: StudentProfile }>('/auth/login', params);
  }

  async signup(params: SignupParams): Promise<{ tempToken: string }> {
    return httpClient.post<{ tempToken: string }>('/auth/signup', params);
  }

  async verifyOTP(otp: string): Promise<{ token: string; user: StudentProfile }> {
    return httpClient.post<{ token: string; user: StudentProfile }>('/auth/verify-otp', { otp });
  }

  async updateProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
    return httpClient.put<StudentProfile>('/students/profile', updates);
  }
}
