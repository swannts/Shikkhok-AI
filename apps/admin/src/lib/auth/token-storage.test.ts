import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
	const mockStorage: Record<string, string> = {};

	beforeEach(() => {
		// Clear storage and in-memory token
		TokenStorage.clear();
		for (const key of Object.keys(mockStorage)) {
			delete mockStorage[key];
		}

		// Mock window and sessionStorage
		const storageMock = {
			getItem: vi.fn((key: string) => mockStorage[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				mockStorage[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStorage[key];
			}),
			clear: vi.fn(() => {
				for (const key of Object.keys(mockStorage)) {
					delete mockStorage[key];
				}
			})
		};

		vi.stubGlobal('window', {
			sessionStorage: storageMock
		});
	});

	it('stores access token in memory and refresh token in sessionStorage', () => {
		TokenStorage.setTokens('mock-access-token', 'mock-refresh-token');

		expect(TokenStorage.getAccessToken()).toBe('mock-access-token');
		expect(TokenStorage.getRefreshToken()).toBe('mock-refresh-token');
		expect(mockStorage['shikkhok_admin_refresh_token']).toBe('mock-refresh-token');
	});

	it('clears both access token and refresh token on clear()', () => {
		TokenStorage.setTokens('access-123', 'refresh-456');
		expect(TokenStorage.hasTokens()).toBe(true);

		TokenStorage.clear();

		expect(TokenStorage.getAccessToken()).toBeNull();
		expect(TokenStorage.getRefreshToken()).toBeNull();
		expect(TokenStorage.hasTokens()).toBe(false);
		expect(mockStorage['shikkhok_admin_refresh_token']).toBeUndefined();
	});

	it('preserves refresh token across memory clear (simulating page reload)', () => {
		TokenStorage.setTokens('access-initial', 'refresh-persistent');

		// Simulate page reload: access token memory cleared, sessionStorage intact
		TokenStorage.setAccessToken(null);

		expect(TokenStorage.getAccessToken()).toBeNull();
		expect(TokenStorage.getRefreshToken()).toBe('refresh-persistent');
	});
});
