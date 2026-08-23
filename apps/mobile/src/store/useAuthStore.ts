import { create } from 'zustand';
import { tokenStorage } from '../services/tokenStorage';
import { authRepository } from '../api/repositories';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface StudentProfile {
  id: string;
  name: string;
  classId: string;
  className: string;
  language: 'bn' | 'en';
  avatar?: string;
}

interface AuthState {
  status: AuthStatus;
  user: StudentProfile | null;
  onboardingCompleted: boolean;
  restoreSession: () => Promise<void>;
  setAuthenticated: (user: StudentProfile, token?: string, refreshToken?: string) => Promise<void>;
  setUnauthenticated: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  user: null,
  onboardingCompleted: true,

  restoreSession: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ status: 'unauthenticated', user: null });
        return;
      }

      // Perform GET /auth/me to hydrate user profile
      try {
        const user = await authRepository.getCurrentUser();
        set({ status: 'authenticated', user });
      } catch {
        // Access token expired, attempt refresh token rotation
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          await tokenStorage.clearTokens();
          set({ status: 'unauthenticated', user: null });
          return;
        }

        const refreshRes = await authRepository.refreshToken(refreshToken);
        await tokenStorage.setAccessToken(refreshRes.token);
        if (refreshRes.refreshToken) {
          await tokenStorage.setRefreshToken(refreshRes.refreshToken);
        }

        const user = await authRepository.getCurrentUser();
        set({ status: 'authenticated', user });
      }
    } catch {
      await tokenStorage.clearTokens();
      set({ status: 'unauthenticated', user: null });
    }
  },

  setAuthenticated: async (user, token, refreshToken) => {
    if (token) {
      await tokenStorage.setAccessToken(token);
    }
    if (refreshToken) {
      await tokenStorage.setRefreshToken(refreshToken);
    }
    set({ status: 'authenticated', user });
  },

  setUnauthenticated: async () => {
    try {
      await authRepository.logout();
    } catch {
      // Ignore logout API failure
    }
    await tokenStorage.clearTokens();
    set({ status: 'unauthenticated', user: null });
  },

  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
}));
