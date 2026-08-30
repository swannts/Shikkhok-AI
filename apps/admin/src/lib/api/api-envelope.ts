/**
 * Standard API response envelope contract matching the NestJS TransformResponseInterceptor.
 */
export interface ApiEnvelope<T> {
	data: T;
	meta?: Record<string, unknown>;
	requestId?: string;
}

/**
 * Checks if a response payload is wrapped in the standard ApiEnvelope.
 */
export function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
	return typeof payload === 'object' && payload !== null && 'data' in payload;
}

/**
 * Centralized unwrapping utility that extracts inner payload `data`
 * from any standard or raw API response.
 */
export function unwrapEnvelope<T>(response: unknown): T {
	if (isApiEnvelope<T>(response)) {
		return response.data;
	}

	return response as T;
}

/**
 * Extracts pagination or contextual metadata if present in the envelope.
 */
export function extractMeta(response: unknown): Record<string, unknown> {
	if (isApiEnvelope(response) && response.meta) {
		return response.meta;
	}

	return {};
}
