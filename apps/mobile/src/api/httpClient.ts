import { ENV } from '../config/env';
import { ApiError } from './apiError';
import { tokenStorage } from '../services/tokenStorage';

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  token?: string;
  skipAuth?: boolean;
}

class HttpClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private subscribeTokenRefresh(cb: (token: string | null) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string | null) {
    this.refreshSubscribers.map((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async getAuthHeader(explicitToken?: string): Promise<Record<string, string>> {
    const token = explicitToken || (await tokenStorage.getAccessToken());
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public async request<TResponse, TBody = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: TBody,
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const authHeaders = options.skipAuth ? {} : await this.getAuthHeader(options.token);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...options.headers,
    };

    let isTimedOut = false;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      timeoutController.abort();
    }, options.timeoutMs || 15000);

    const combinedSignal = timeoutController.signal;
    let removeCallerListener: (() => void) | undefined;

    if (options.signal) {
      if (options.signal.aborted) {
        timeoutController.abort();
      } else {
        const onCallerAbort = () => timeoutController.abort();
        options.signal.addEventListener('abort', onCallerAbort);
        removeCallerListener = () => options.signal?.removeEventListener('abort', onCallerAbort);
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);
      if (removeCallerListener) removeCallerListener();

      // Handle 401 Unauthorized with single-flight refresh queue
      if (response.status === 401 && !options.skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        return this.handle401AndRetry<TResponse, TBody>(endpoint, method, body, options);
      }

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        try {
          errorData = (await response.json()) as Record<string, unknown>;
        } catch {
          // Response was not JSON
        }
        throw new ApiError({
          statusCode: response.status,
          errorCode: (errorData.errorCode as string) || `HTTP_${response.status}`,
          message: (errorData.message as string) || response.statusText,
          banglaMessage: errorData.banglaMessage as string | undefined,
          details: errorData.details as Record<string, unknown> | undefined,
        });
      }

      const data = await response.json();
      return data as TResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (removeCallerListener) removeCallerListener();

      if (err instanceof Error && err.name === 'AbortError') {
        if (isTimedOut) {
          throw new ApiError({
            statusCode: 408,
            errorCode: 'REQUEST_TIMEOUT',
            message: 'Request timed out',
            banglaMessage: 'অনুরোধের সময় পার হয়ে গেছে। নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।',
          });
        }
        throw new ApiError({
          statusCode: 499,
          errorCode: 'REQUEST_ABORTED',
          message: 'Request cancelled by user',
          banglaMessage: 'অনুরোধটি বাতিল করা হয়েছে।',
        });
      }
      throw ApiError.fromUnknown(err);
    }
  }

  private async handle401AndRetry<TResponse, TBody>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: TBody,
    options: RequestOptions = {}
  ): Promise<TResponse> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const refreshRes = await this.request<{ token: string; refreshToken?: string }>(
          '/auth/refresh',
          'POST',
          { refreshToken },
          { skipAuth: true }
        );

        await tokenStorage.setAccessToken(refreshRes.token);
        if (refreshRes.refreshToken) {
          await tokenStorage.setRefreshToken(refreshRes.refreshToken);
        }

        this.isRefreshing = false;
        this.onRefreshed(refreshRes.token);
        return this.request<TResponse, TBody>(endpoint, method, body, options);
      } catch (err) {
        this.isRefreshing = false;
        this.onRefreshed(null);
        await tokenStorage.clearTokens();
        throw ApiError.fromUnknown(err);
      }
    }

    // Wait for the single active refresh request to finish
    return new Promise((resolve, reject) => {
      this.subscribeTokenRefresh((newToken) => {
        if (newToken) {
          resolve(this.request<TResponse, TBody>(endpoint, method, body, options));
        } else {
          reject(
            new ApiError({
              statusCode: 401,
              errorCode: 'UNAUTHORIZED',
              message: 'Session expired',
              banglaMessage: 'আপনার সেশনের মেয়াদ পার হয়ে গেছে। পুনরায় লগইন করুন।',
            })
          );
        }
      });
    });
  }

  public get<TResponse>(endpoint: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>(endpoint, 'GET', undefined, options);
  }

  public post<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(endpoint, 'POST', body, options);
  }

  public put<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(endpoint, 'PUT', body, options);
  }

  public delete<TResponse>(endpoint: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>(endpoint, 'DELETE', undefined, options);
  }

  public async streamText(
    endpoint: string,
    body: unknown,
    onDelta: (delta: string) => void,
    options?: RequestOptions
  ): Promise<string> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const authHeaders = options?.skipAuth ? {} : await this.getAuthHeader(options?.token);

    let isTimedOut = false;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      timeoutController.abort();
    }, options?.timeoutMs || 30000);

    const combinedSignal = timeoutController.signal;
    let removeCallerListener: (() => void) | undefined;

    if (options?.signal) {
      if (options.signal.aborted) {
        timeoutController.abort();
      } else {
        const onCallerAbort = () => timeoutController.abort();
        options.signal.addEventListener('abort', onCallerAbort);
        removeCallerListener = () => options.signal?.removeEventListener('abort', onCallerAbort);
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
          ...authHeaders,
          ...options?.headers,
        },
        body: JSON.stringify(body),
        signal: combinedSignal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        if (removeCallerListener) removeCallerListener();
        throw new ApiError({
          statusCode: response.status,
          errorCode: 'STREAM_ERROR',
          message: 'Streaming request failed',
        });
      }

      if (!response.body) {
        clearTimeout(timeoutId);
        if (removeCallerListener) removeCallerListener();
        const fullText = await response.text();
        onDelta(fullText);
        return fullText;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullAccumulated = '';
      let buffer = '';
      let isStreamCompleted = false;

      /* eslint-disable-next-line no-constant-condition */
      while (!isStreamCompleted) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            fullAccumulated += buffer.trim();
            onDelta(buffer.trim());
          }
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataContent = trimmed.slice(5).trim();
            if (dataContent === '[DONE]') {
              isStreamCompleted = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataContent);
              const deltaText = parsed.text || parsed.delta || parsed.content || '';
              if (deltaText) {
                fullAccumulated += deltaText;
                onDelta(deltaText);
              }
            } catch {
              fullAccumulated += dataContent;
              onDelta(dataContent);
            }
          } else {
            fullAccumulated += trimmed;
            onDelta(trimmed);
          }
        }
      }

      clearTimeout(timeoutId);
      if (removeCallerListener) removeCallerListener();
      return fullAccumulated;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (removeCallerListener) removeCallerListener();

      if (err instanceof Error && err.name === 'AbortError') {
        if (isTimedOut) {
          throw new ApiError({
            statusCode: 408,
            errorCode: 'REQUEST_TIMEOUT',
            message: 'Streaming timed out',
            banglaMessage: 'স্ট্রিমিং সময় পার হয়ে গেছে।',
          });
        }
        throw new ApiError({
          statusCode: 499,
          errorCode: 'REQUEST_ABORTED',
          message: 'Streaming cancelled by user',
          banglaMessage: 'স্ট্রিমিং বাতিল করা হয়েছে।',
        });
      }
      throw ApiError.fromUnknown(err);
    }
  }
}

export const httpClient = new HttpClient(ENV.apiBaseUrl);
export const aiGatewayClient = new HttpClient(ENV.aiGatewayUrl);
