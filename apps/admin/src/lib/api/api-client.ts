import { ENV } from '@/config/env';
import {
	ApiError,
	ConflictError,
	ForbiddenError,
	NetworkError,
	NotFoundError,
	RateLimitError,
	ServerError,
	UnauthorizedError,
	ValidationError
} from '@/lib/errors/api-errors';
import { unwrapEnvelope } from './api-envelope';
import { TokenStorage } from '@/lib/auth/token-storage';

export interface RequestOptions extends RequestInit {
	timeoutMs?: number;
	skipAuth?: boolean;
	_retry?: boolean;
}

type SessionExpiredHandler = () => void;

class ApiClient {
	private readonly baseUrl: string;
	private isRefreshing = false;
	private refreshPromise: Promise<string | null> | null = null;
	private onSessionExpiredCallbacks = new Set<SessionExpiredHandler>();

	constructor(baseUrl: string = ENV.apiBaseUrl) {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	/**
	 * Subscribe to session expiration events (e.g. refresh token failed or invalid).
	 */
	onSessionExpired(callback: SessionExpiredHandler): () => void {
		this.onSessionExpiredCallbacks.add(callback);
		return () => {
			this.onSessionExpiredCallbacks.delete(callback);
		};
	}

	private notifySessionExpired(): void {
		TokenStorage.clear();
		this.onSessionExpiredCallbacks.forEach((cb) => {
			try {
				cb();
			} catch (err) {
				console.error('Error during session expired callback execution:', err);
			}
		});
	}

	private buildUrl(path: string): string {
		if (path.startsWith('http://') || path.startsWith('https://')) {
			return path;
		}

		const cleanPath = path.startsWith('/') ? path : `/${path}`;
		return `${this.baseUrl}${cleanPath}`;
	}

	/**
	 * Single-flight token refresh coordinator.
	 * If multiple concurrent requests trigger 401, only one refresh request
	 * is made to the backend.
	 */
	private async handleSingleFlightRefresh(): Promise<string | null> {
		if (this.isRefreshing && this.refreshPromise) {
			return this.refreshPromise;
		}

		this.isRefreshing = true;
		this.refreshPromise = (async () => {
			try {
				const refreshToken = TokenStorage.getRefreshToken();

				if (!refreshToken) {
					throw new UnauthorizedError('No refresh token available');
				}

				const refreshUrl = this.buildUrl('/auth/refresh');
				const response = await fetch(refreshUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json'
					},
					body: JSON.stringify({ refreshToken })
				});

				if (!response.ok) {
					throw new UnauthorizedError('Failed to refresh token');
				}

				const raw = await response.json();
				const payload = unwrapEnvelope<{ accessToken?: string; token?: string; refreshToken?: string }>(raw);

				const newAccessToken = payload.accessToken || payload.token;
				const newRefreshToken = payload.refreshToken || refreshToken;

				if (!newAccessToken) {
					throw new UnauthorizedError('Refresh response missing access token');
				}

				TokenStorage.setTokens(newAccessToken, newRefreshToken);
				return newAccessToken;
			} catch (err) {
				this.notifySessionExpired();
				throw err;
			} finally {
				this.isRefreshing = false;
				this.refreshPromise = null;
			}
		})();

		return this.refreshPromise;
	}

	/**
	 * Maps an HTTP response and parsed error payload to typed ApiError subclasses.
	 */
	private async mapResponseError(response: Response): Promise<ApiError> {
		let errorObj: Record<string, unknown> = {};
		let message = `Request failed with status ${response.status}`;
		let errorCode = `HTTP_${response.status}`;
		let details: Record<string, unknown> | undefined;

		try {
			const raw = await response.json();

			if (raw && typeof raw === 'object') {
				const errProp = (raw as Record<string, unknown>).error;

				if (errProp && typeof errProp === 'object') {
					errorObj = errProp as Record<string, unknown>;
					message = String(errorObj.message || message);
					errorCode = String(errorObj.code || errorCode);

					if (errorObj.details && typeof errorObj.details === 'object') {
						details = errorObj.details as Record<string, unknown>;
					}
				} else {
					message = String((raw as Record<string, unknown>).message || message);
					errorCode = String(
						(raw as Record<string, unknown>).errorCode || (raw as Record<string, unknown>).code || errorCode
					);
				}
			}
		} catch {
			// Body was not JSON
		}

		switch (response.status) {
			case 400:
				return new ValidationError(message, details);
			case 401:
				return new UnauthorizedError(message, details);
			case 403:
				return new ForbiddenError(message, details);
			case 404:
				return new NotFoundError(message, details);
			case 409:
				return new ConflictError(message, details);
			case 429:
				return new RateLimitError(message, details);
			default:
				if (response.status >= 500) {
					return new ServerError(message, details);
				}

				return new ApiError(message, response.status, errorCode, details);
		}
	}

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const {
			timeoutMs = 15000,
			skipAuth = false,
			_retry = false,
			headers: customHeaders = {},
			...fetchOptions
		} = options;

		const url = this.buildUrl(path);
		const headers = new Headers(customHeaders);

		if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
			headers.set('Content-Type', 'application/json');
		}

		if (!headers.has('Accept')) {
			headers.set('Accept', 'application/json');
		}

		if (!skipAuth) {
			const token = TokenStorage.getAccessToken();

			if (token) {
				headers.set('Authorization', `Bearer ${token}`);
			}
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				...fetchOptions,
				headers,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			const isAuthEndpoint =
				path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/refresh');

			// 401 Handling: Attempt single-flight refresh once, then retry
			if (response.status === 401 && !skipAuth && !isAuthEndpoint && !_retry) {
				try {
					const newToken = await this.handleSingleFlightRefresh();

					if (newToken) {
						return this.request<T>(path, {
							...options,
							_retry: true
						});
					}
				} catch {
					throw new UnauthorizedError('Session expired. Please log in again.');
				}
			}

			if (!response.ok) {
				throw await this.mapResponseError(response);
			}

			// Handle 204 No Content
			if (response.status === 204) {
				return undefined as unknown as T;
			}

			const rawJson = await response.json();
			return unwrapEnvelope<T>(rawJson);
		} catch (err) {
			clearTimeout(timeoutId);

			if (err instanceof ApiError) {
				throw err;
			}

			if (err instanceof DOMException && err.name === 'AbortError') {
				throw new NetworkError('Request timed out. Please try again.');
			}

			throw new NetworkError(err instanceof Error ? err.message : 'A network connection error occurred.');
		}
	}

	get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
		return this.request<T>(path, { ...options, method: 'GET' });
	}

	post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
		return this.request<T>(path, {
			...options,
			method: 'POST',
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
	}

	put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
		return this.request<T>(path, {
			...options,
			method: 'PUT',
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
	}

	patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
		return this.request<T>(path, {
			...options,
			method: 'PATCH',
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
	}

	delete<T>(path: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
		return this.request<T>(path, { ...options, method: 'DELETE' });
	}
}

export const apiClient = new ApiClient();
export { ApiClient };
