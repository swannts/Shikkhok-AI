/**
 * TokenStorage abstraction for Shikkhok-AI Admin Console.
 *
 * Security Architecture Decision:
 * 1. Access Token: Stored strictly in-memory within client JavaScript runtime to prevent
 *    persistent exposure against XSS attacks.
 * 2. Refresh Token: Stored in window.sessionStorage as the backend currently returns
 *    refresh tokens in JSON payloads (no HttpOnly cookie support yet).
 *    SessionStorage isolates the token to the active browser tab session and is cleared
 *    when the tab closes.
 *
 * NOTE: When the NestJS backend adopts Set-Cookie HttpOnly refresh tokens in a future milestone,
 * this storage layer can seamlessly deprecate client-side refresh storage without breaking
 * ApiClient or AuthProvider.
 */

let inMemoryAccessToken: string | null = null;

const REFRESH_TOKEN_KEY = 'shikkhok_admin_refresh_token';

export const TokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (token) {
        window.sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (err) {
      console.error('Failed to update refresh token in sessionStorage:', err);
    }
  },

  setTokens(accessToken: string | null, refreshToken: string | null): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  clear(): void {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  },
};
