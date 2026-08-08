import { create } from 'zustand';
import { setLanguage } from '../localization/i18n';

interface UIState {
  language: 'bn' | 'en';
  isOffline: boolean;
  setLanguage: (lang: 'bn' | 'en') => void;
  setOffline: (offline: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  language: 'bn',
  isOffline: false,
  setLanguage: (lang) => {
    setLanguage(lang);
    set({ language: lang });
  },
  setOffline: (offline) => set({ isOffline: offline }),
}));
