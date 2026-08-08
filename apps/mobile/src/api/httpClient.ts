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

  public async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const authHeaders = await this.getAuthHeader(options.token);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...options.headers,
    };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeoutMs || 15000);
    const signal = options.signal || controller.signal;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Response was not JSON
        }
        throw new ApiError({
          statusCode: response.status,
          errorCode: errorData.errorCode || `HTTP_${response.status}`,
          message: errorData.message || response.statusText,
          banglaMessage: errorData.banglaMessage,
          details: errorData.details,
        });
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        throw new ApiError({
          statusCode: 408,
          errorCode: 'REQUEST_TIMEOUT',
          message: 'Request timed out',
          banglaMessage: 'অনুরোধের সময় পার হয়ে গেছে। নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।',
        });
      }
      throw ApiError.fromUnknown(err);
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  public post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  public put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }

  // SSE Chunked Streaming for AI Tutor response stream
  public async streamText(
    endpoint: string,
    body: any,
    onChunk: (chunk: string) => void,
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
        message: 'Streaming failed',
      });
    }

    if (!response.body) {
      const fullText = await response.text();
      onChunk(fullText);
      return fullText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      accumulated += text;
      onChunk(accumulated);
    }

    return accumulated;
  }
}

export const httpClient = new HttpClient(ENV.apiBaseUrl);
export const aiGatewayClient = new HttpClient(ENV.aiGatewayUrl);
