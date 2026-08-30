import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient } from './api-client';
import { TokenStorage } from '../auth/token-storage';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../errors/api-errors';

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

describe('ApiClient & Single-Flight Refresh Architecture', () => {
	let client: ApiClient;
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

		client = new ApiClient('http://localhost:3000');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('attaches Bearer token to authenticated requests', async () => {
		TokenStorage.setTokens('valid-access-jwt', 'valid-refresh-jwt');

		const fetchSpy = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
			const auth = getHeader(init?.headers, 'authorization');
			expect(auth).toBe('Bearer valid-access-jwt');

			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => ({
					data: { id: 'admin-1', role: 'admin' },
					meta: {},
					requestId: 'req-1'
				})
			});
		});

		vi.stubGlobal('fetch', fetchSpy);

		const result = await client.get('/auth/me');
		expect(result).toEqual({ id: 'admin-1', role: 'admin' });
		expect(fetchSpy).toHaveBeenCalled();
	});

	it('single-flight refresh: triggers ONLY ONE refresh call for concurrent 401s', async () => {
		TokenStorage.setTokens('stale-access-jwt', 'current-refresh-token');

		let refreshCallCount = 0;

		const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
			const urlStr = url.toString();

			if (urlStr.includes('/auth/refresh')) {
				refreshCallCount++;
				const body = JSON.parse(init?.body as string);
				expect(body).toEqual({ refreshToken: 'current-refresh-token' });

				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						data: {
							accessToken: 'refreshed-fresh-access-jwt',
							refreshToken: 'new-rotated-refresh-jwt'
						},
						meta: {},
						requestId: 'req-refresh-1'
					})
				});
			}

			if (urlStr.includes('/users') || urlStr.includes('/curriculum') || urlStr.includes('/auth/me')) {
				const authHeader = getHeader(init?.headers, 'authorization');

				// If stale token, return 401
				if (authHeader === 'Bearer stale-access-jwt') {
					return Promise.resolve({
						ok: false,
						status: 401,
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => ({
							message: 'jwt expired',
							statusCode: 401,
							errorCode: 'UNAUTHORIZED'
						})
					});
				}

				// If refreshed token, succeed
				if (authHeader === 'Bearer refreshed-fresh-access-jwt') {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => ({
							data: { resource: urlStr, success: true },
							meta: {},
							requestId: 'req-ok'
						})
					});
				}
			}

			throw new Error(`Unexpected URL in test: ${urlStr}`);
		});

		vi.stubGlobal('fetch', fetchSpy);

		// Fire 3 simultaneous requests (A, B, C)
		const [resA, resB, resC] = await Promise.all([
			client.get<{ resource: string }>('/users'),
			client.get<{ resource: string }>('/curriculum'),
			client.get<{ resource: string }>('/auth/me')
		]);

		// 1. Exactly ONE refresh request made
		expect(refreshCallCount).toBe(1);

		// 2. All 3 requests retried and succeeded with new access token
		expect(resA.resource).toContain('/users');
		expect(resB.resource).toContain('/curriculum');
		expect(resC.resource).toContain('/auth/me');

		// 3. New tokens persisted
		expect(TokenStorage.getAccessToken()).toBe('refreshed-fresh-access-jwt');
		expect(TokenStorage.getRefreshToken()).toBe('new-rotated-refresh-jwt');
	});

	it('notifies session expired and clears tokens when refresh endpoint fails', async () => {
		TokenStorage.setTokens('expired-access', 'invalid-refresh');

		const sessionExpiredSpy = vi.fn();
		client.onSessionExpired(sessionExpiredSpy);

		const fetchSpy = vi.fn().mockImplementation((url: string) => {
			const urlStr = url.toString();

			if (urlStr.includes('/auth/refresh')) {
				return Promise.resolve({
					ok: false,
					status: 401,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({
						message: 'Refresh token invalid or expired',
						statusCode: 401,
						errorCode: 'UNAUTHORIZED'
					})
				});
			}

			return Promise.resolve({
				ok: false,
				status: 401,
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => ({
					message: 'Access token expired',
					statusCode: 401
				})
			});
		});

		vi.stubGlobal('fetch', fetchSpy);

		await expect(client.get('/users')).rejects.toThrow(UnauthorizedError);

		expect(sessionExpiredSpy).toHaveBeenCalledTimes(1);
		expect(TokenStorage.getAccessToken()).toBeNull();
		expect(TokenStorage.getRefreshToken()).toBeNull();
	});

	it('translates 400, 403, 404 status codes into typed domain errors', async () => {
		TokenStorage.setTokens('valid-token', 'valid-refresh');

		const fetchSpy = vi.fn().mockImplementation((url: string) => {
			const urlStr = url.toString();

			if (urlStr.includes('/bad-request')) {
				return Promise.resolve({
					ok: false,
					status: 400,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({ message: 'Invalid payload fields', statusCode: 400 })
				});
			}

			if (urlStr.includes('/forbidden')) {
				return Promise.resolve({
					ok: false,
					status: 403,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({ message: 'Admin access required', statusCode: 403 })
				});
			}

			if (urlStr.includes('/not-found')) {
				return Promise.resolve({
					ok: false,
					status: 404,
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => ({ message: 'User not found', statusCode: 404 })
				});
			}

			throw new Error(`Unexpected url ${urlStr}`);
		});

		vi.stubGlobal('fetch', fetchSpy);

		await expect(client.get('/bad-request')).rejects.toThrow(ValidationError);
		await expect(client.get('/forbidden')).rejects.toThrow(ForbiddenError);
		await expect(client.get('/not-found')).rejects.toThrow(NotFoundError);
	});
});
