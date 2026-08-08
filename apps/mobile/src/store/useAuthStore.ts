import { create } from 'zustand';
import { tokenStorage } from '../services/tokenStorage';

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
  setAuthenticated: (user: StudentProfile, token?: string) => Promise<void>;
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
      if (token) {
        set({
          status: 'authenticated',
          user: {
            id: 'student-1',
            name: 'রাফি আহমেদ',
            classId: 'class-8',
            className: 'Class 8',
            language: 'bn',
          },
        });
      } else {
        set({ status: 'unauthenticated', user: null });
      }
    } catch {
      set({ status: 'unauthenticated', user: null });
    }
  },

  setAuthenticated: async (user, token) => {
    if (token) {
      await tokenStorage.setAccessToken(token);
    }
    set({ status: 'authenticated', user });
  },

  setUnauthenticated: async () => {
    await tokenStorage.clearTokens();
    set({ status: 'unauthenticated', user: null });
  },

  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
}));
