import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'shikkhok_access_token';
const REFRESH_TOKEN_KEY = 'shikkhok_refresh_token';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return memoryAccessToken;
    }
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return memoryAccessToken;
    }
  },

  setAccessToken: async (token: string): Promise<void> => {
    memoryAccessToken = token;
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      } catch {
        // Fallback to memory
      }
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return memoryRefreshToken;
    }
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return memoryRefreshToken;
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    memoryRefreshToken = token;
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      } catch {
        // Fallback to memory
      }
    }
  },

  clearTokens: async (): Promise<void> => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      } catch {
        // Ignore delete errors
      }
    }
  },
};
