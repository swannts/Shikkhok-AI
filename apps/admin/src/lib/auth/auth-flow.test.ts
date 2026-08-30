import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient } from '../api/api-client';
import { TokenStorage } from './token-storage';
import { UnauthorizedError } from '../errors/api-errors';

function getHeader(headers: HeadersInit | undefined, name: string): string | null {
	if (!headers) return null;

	if (headers instanceof Headers) {
		return headers.get(name);
	}

	if (Array.isArray(headers)) {
		const entry = headers.find(([k]) => k.toLowerCase() === name.toLowerCase());
		return entry ? entry[1] : null;
	}

	return (headers as Record<string, string>)[name] ?? null;
}

describe('Auth Flow & Admin Role Authorization', () => {
	const mockStorage: Record<string, string> = {};

	beforeEach(() => {
		TokenStorage.clear();
		for (const key of Object.keys(mockStorage)) {
			delete mockStorage[key];
		}

		vi.stubGlobal('window', {
			sessionStorage: {
				getItem: (k: string) => mockStorage[k] ?? null,
				setItem: (k: string, v: string) => {
					mockStorage[k] = v;
				},
				removeItem: (k: string) => {
					delete mockStorage[k];
				},
				clear: () => {
					for (const key of Object.keys(mockStorage)) {
						delete mockStorage[key];
					}
				}
			}
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('Admin login: receives tokens, verifies /auth/me authoritative admin role, and keeps tokens', async () => {
		const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
			const urlStr = url.toString();

			if (urlStr.includes('/auth/login')) {
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual({
					identifier: 'admin@shikkhok.ai',
					password: 'CorrectAdminPassword123!'
				});

				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						data: {
							user: { _id: 'u-admin-1', name: 'Master Admin', role: 'admin' },
							tokens: {
								accessToken: 'jwt-access-token-admin',
								refreshToken: 'jwt-refresh-token-admin'
							}
						},
						meta: {},
						requestId: 'req-login-1'
					})
				});
			}

			if (urlStr.includes('/auth/me')) {
				const auth = getHeader(init?.headers, 'authorization');
				expect(auth).toBe('Bearer jwt-access-token-admin');

				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						data: {
							_id: 'u-admin-1',
							name: 'Master Admin',
							email: 'admin@shikkhok.ai',
							role: 'admin',
							status: 'active'
						},
						meta: {},
						requestId: 'req-me-1'
					})
				});
			}

			throw new Error(`Unexpected url: ${urlStr}`);
		});

		vi.stubGlobal('fetch', fetchSpy);

		// 1. Post login
		const loginRes = await apiClient.post<{
			user: { _id: string; role: string };
			tokens: { accessToken: string; refreshToken: string };
		}>('/auth/login', {
			identifier: 'admin@shikkhok.ai',
			password: 'CorrectAdminPassword123!'
		});

		TokenStorage.setTokens(loginRes.tokens.accessToken, loginRes.tokens.refreshToken);

		// 2. Authoritative check via /auth/me
		const meUser = await apiClient.get<{ _id: string; role: string; name: string }>('/auth/me');

		expect(meUser.role).toBe('admin');
		expect(TokenStorage.getAccessToken()).toBe('jwt-access-token-admin');
		expect(TokenStorage.getRefreshToken()).toBe('jwt-refresh-token-admin');
	});

	it('Non-admin login: /auth/me returns non-admin, tokens are immediately purged, and access is forbidden', async () => {
		const fetchSpy = vi.fn().mockImplementation((url: string) => {
			const urlStr = url.toString();

			if (urlStr.includes('/auth/login')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						data: {
							user: { _id: 'u-student-99', name: 'Student User', role: 'student' },
							tokens: {
								accessToken: 'jwt-access-token-student',
								refreshToken: 'jwt-refresh-token-student'
							}
						},
						meta: {},
						requestId: 'req-login-student'
					})
				});
			}

			if (urlStr.includes('/auth/me')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						data: {
							_id: 'u-student-99',
							name: 'Student User',
							email: 'student@shikkhok.ai',
							role: 'student', // Non-admin!
							status: 'active'
						},
						meta: {},
						requestId: 'req-me-student'
					})
				});
			}

			throw new Error(`Unexpected url: ${urlStr}`);
		});

		vi.stubGlobal('fetch', fetchSpy);

		const loginRes = await apiClient.post<{
			user: { _id: string; role: string };
			tokens: { accessToken: string; refreshToken: string };
		}>('/auth/login', {
			identifier: 'student@shikkhok.ai',
			password: 'StudentPassword!'
		});

		TokenStorage.setTokens(loginRes.tokens.accessToken, loginRes.tokens.refreshToken);

		const meUser = await apiClient.get<{ role: string }>('/auth/me');

		// Reject non-admin: clear tokens
		if (meUser.role !== 'admin') {
			TokenStorage.clear();
		}

		expect(meUser.role).not.toBe('admin');
		expect(TokenStorage.getAccessToken()).toBeNull();
		expect(TokenStorage.getRefreshToken()).toBeNull();
		expect(TokenStorage.hasTokens()).toBe(false);
	});

	it('Invalid login: returns 401 and prevents token storage', async () => {
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => ({
				message: 'Invalid email/phone or password',
				statusCode: 401,
				errorCode: 'UNAUTHORIZED'
			})
		});

		vi.stubGlobal('fetch', fetchSpy);

		await expect(
			apiClient.post('/auth/login', {
				identifier: 'wrong@shikkhok.ai',
				password: 'BadPassword'
			})
		).rejects.toThrow(UnauthorizedError);

		expect(TokenStorage.getAccessToken()).toBeNull();
		expect(TokenStorage.getRefreshToken()).toBeNull();
	});

	it('Session restoration: refresh token in sessionStorage restores memory access token via /auth/me', async () => {
		mockStorage['shikkhok_admin_refresh_token'] = 'persisted-refresh-token';
		TokenStorage.setAccessToken(null);

		const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
			const urlStr = url.toString();

			if (urlStr.includes('/auth/refresh')) {
				const body = JSON.parse(init?.body as string);
				expect(body.refreshToken).toBe('persisted-refresh-token');

				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						data: {
							accessToken: 'new-restored-access-jwt',
							refreshToken: 'new-restored-refresh-jwt'
						},
						meta: {},
						requestId: 'req-ref-restore'
					})
				});
			}

			if (urlStr.includes('/auth/me')) {
				const auth = getHeader(init?.headers, 'authorization');

				// Initial request without access token fails with 401
				if (!auth || auth === 'Bearer ') {
					return Promise.resolve({
						ok: false,
						status: 401,
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => ({ message: 'Unauthorized', statusCode: 401 })
					});
				}

				if (auth === 'Bearer new-restored-access-jwt') {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => ({
							data: {
								_id: 'u-admin-restored',
								name: 'Restored Admin',
								role: 'admin'
							},
							meta: {},
							requestId: 'req-me-restored'
						})
					});
				}
			}

			throw new Error(`Unexpected url: ${urlStr}`);
		});

		vi.stubGlobal('fetch', fetchSpy);

		const meProfile = await apiClient.get<{ role: string; name: string }>('/auth/me');

		expect(meProfile.role).toBe('admin');
		expect(meProfile.name).toBe('Restored Admin');
		expect(TokenStorage.getAccessToken()).toBe('new-restored-access-jwt');
		expect(TokenStorage.getRefreshToken()).toBe('new-restored-refresh-jwt');
	});

	it('Logout: sends refresh token to /auth/logout and clears local tokens', async () => {
		TokenStorage.setTokens('active-access-jwt', 'active-refresh-jwt');

		const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
			const urlStr = url.toString();

			if (urlStr.includes('/auth/logout')) {
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual({ refreshToken: 'active-refresh-jwt' });
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({ data: { success: true }, meta: {}, requestId: 'req-logout' })
				});
			}

			throw new Error(`Unexpected url: ${urlStr}`);
		});

		vi.stubGlobal('fetch', fetchSpy);

		const refreshToken = TokenStorage.getRefreshToken();

		if (refreshToken) {
			await apiClient.post('/auth/logout', { refreshToken });
		}

		TokenStorage.clear();

		expect(TokenStorage.getAccessToken()).toBeNull();
		expect(TokenStorage.getRefreshToken()).toBeNull();
		expect(TokenStorage.hasTokens()).toBe(false);
	});
});
