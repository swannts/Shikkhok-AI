import { describe, it, expect } from 'vitest';
import { unwrapEnvelope, extractMeta } from './api-envelope';

describe('API Envelope Unwrapping', () => {
	it('unwraps standardized NestJS envelope { data, meta, requestId }', () => {
		const backendResponse = {
			data: { id: 'admin_123', name: 'Super Admin', role: 'admin' },
			meta: { timestamp: '2026-08-30T12:00:00.000Z' },
			requestId: 'req-abc-999'
		};

		const unwrapped = unwrapEnvelope<typeof backendResponse.data>(backendResponse);
		expect(unwrapped).toEqual({
			id: 'admin_123',
			name: 'Super Admin',
			role: 'admin'
		});
	});

	it('unwraps array payloads within an envelope', () => {
		const listResponse = {
			data: [
				{ id: '1', title: 'Curriculum A' },
				{ id: '2', title: 'Curriculum B' }
			],
			meta: { total: 2, page: 1, limit: 10 },
			requestId: 'req-list-001'
		};

		const unwrapped = unwrapEnvelope<typeof listResponse.data>(listResponse);
		expect(unwrapped).toHaveLength(2);
		expect(unwrapped[0].title).toBe('Curriculum A');
	});

	it('extracts metadata safely when present', () => {
		const responseWithMeta = {
			data: { success: true },
			meta: { totalCount: 42, cached: false },
			requestId: 'req-meta-1'
		};

		const meta = extractMeta(responseWithMeta);
		expect(meta).toEqual({ totalCount: 42, cached: false });
	});

	it('returns empty object when metadata is missing or non-envelope payload is received', () => {
		expect(extractMeta({ hello: 'world' })).toEqual({});
		expect(extractMeta(null)).toEqual({});
		expect(extractMeta(undefined)).toEqual({});
	});

	it('safely handles non-enveloped fallback data gracefully', () => {
		const rawData = { direct: 'response' };
		const unwrapped = unwrapEnvelope(rawData);
		expect(unwrapped).toEqual({ direct: 'response' });
	});

	it('handles null and undefined payloads cleanly', () => {
		expect(unwrapEnvelope(null)).toBeNull();
		expect(unwrapEnvelope(undefined)).toBeUndefined();
	});
});
