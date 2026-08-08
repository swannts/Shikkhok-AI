import { ENV } from '../config/env';
import { ApiError } from './apiError';

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  token?: string;
}

class HttpClient {
  private baseUrl: string;
  private tokenProvider?: () => Promise<string | null>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public setTokenProvider(provider: () => Promise<string | null>) {
    this.tokenProvider = provider;
  }

  private async getAuthHeader(explicitToken?: string): Promise<Record<string, string>> {
    const token = explicitToken || (this.tokenProvider ? await this.tokenProvider() : null);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public async request<TResponse, TBody = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: TBody,
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const authHeaders = await this.getAuthHeader(options.token);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...options.headers,
    };

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      options.timeoutMs || 15000
    );

    // Combine caller signal and timeout signal
    let combinedSignal = timeoutController.signal;
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
        throw new ApiError({
          statusCode: 408,
          errorCode: 'REQUEST_TIMEOUT',
          message: 'Request timed out or was cancelled',
          banglaMessage: 'অনুরোধের সময় পার হয়ে গেছে। নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।',
        });
      }
      throw ApiError.fromUnknown(err);
    }
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

  /**
   * Stream text responses over Server-Sent Events (SSE) or raw chunked transfer.
   * Calls `onDelta(delta)` with each new string segment arrived.
   */
  public async streamText(
    endpoint: string,
    body: unknown,
    onDelta: (delta: string) => void,
    options?: RequestOptions
  ): Promise<string> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const authHeaders = await this.getAuthHeader(options?.token);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        ...authHeaders,
        ...options?.headers,
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new ApiError({
        statusCode: response.status,
        errorCode: 'STREAM_ERROR',
        message: 'Streaming request failed',
      });
    }

    if (!response.body) {
      const fullText = await response.text();
      onDelta(fullText);
      return fullText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullAccumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      buffer += chunkText;

      // Parse SSE lines formatted as `data: {...}` or raw text
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/empty lines

        if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.slice(5).trim();
          if (dataContent === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataContent);
            const deltaText = parsed.text || parsed.delta || parsed.content || '';
            if (deltaText) {
              fullAccumulated += deltaText;
              onDelta(deltaText);
            }
          } catch {
            // Raw text inside data
            fullAccumulated += dataContent;
            onDelta(dataContent);
          }
        } else {
          // Direct chunked text without SSE framing
          fullAccumulated += trimmed;
          onDelta(trimmed);
        }
      }
    }

    return fullAccumulated;
  }
}

export const httpClient = new HttpClient(ENV.apiBaseUrl);
export const aiGatewayClient = new HttpClient(ENV.aiGatewayUrl);
