import { IAuthRepository, AuthResponse, LoginParams, SignupParams } from '../interfaces/IRepositories';
import { httpClient } from '../../httpClient';
import { StudentProfile } from '../../../store/useAuthStore';

export class ApiAuthRepository implements IAuthRepository {
  async login(params: LoginParams): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/login', params, { skipAuth: true });
  }

  async signup(params: SignupParams): Promise<{ status: string; referenceId?: string }> {
    return httpClient.post<{ status: string; referenceId?: string }>('/auth/signup', params, { skipAuth: true });
  }

  async verifyOtp(referenceId: string, otp: string): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/verify-otp', { referenceId, otp }, { skipAuth: true });
  }

  async getCurrentUser(): Promise<StudentProfile> {
    return httpClient.get<StudentProfile>('/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken?: string }> {
    return httpClient.post<{ token: string; refreshToken?: string }>('/auth/refresh', { refreshToken }, { skipAuth: true });
  }

  async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  }
}
