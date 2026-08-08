import { create } from 'zustand';

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
  setAuthenticated: (user: StudentProfile) => void;
  setUnauthenticated: () => void;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'authenticated',
  user: {
    id: 'student-1',
    name: 'রাফি',
    classId: 'class-8',
    className: 'Class 8',
    language: 'bn',
  },
  onboardingCompleted: true,
  setAuthenticated: (user) => set({ status: 'authenticated', user }),
  setUnauthenticated: () => set({ status: 'unauthenticated', user: null }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
}));
