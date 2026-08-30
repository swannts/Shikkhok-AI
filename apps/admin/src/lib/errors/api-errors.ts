/**
 * Base API Error class for Shikkhok-AI Admin.
 */
export class ApiError extends Error {
	readonly statusCode: number;
	readonly errorCode: string;
	readonly details?: Record<string, unknown>;

	constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR', details?: Record<string, unknown>) {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class ValidationError extends ApiError {
	constructor(message = 'Validation failed. Please verify your input.', details?: Record<string, unknown>) {
		super(message, 400, 'VALIDATION_ERROR', details);
		this.name = 'ValidationError';
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message = 'Your session has expired or authentication is invalid.', details?: Record<string, unknown>) {
		super(message, 401, 'UNAUTHORIZED', details);
		this.name = 'UnauthorizedError';
	}
}

export class ForbiddenError extends ApiError {
	constructor(message = 'You do not have permission to perform this action.', details?: Record<string, unknown>) {
		super(message, 403, 'FORBIDDEN', details);
		this.name = 'ForbiddenError';
	}
}

export class NotFoundError extends ApiError {
	constructor(message = 'The requested resource was not found.', details?: Record<string, unknown>) {
		super(message, 404, 'NOT_FOUND', details);
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends ApiError {
	constructor(message = 'A conflict occurred with an existing resource.', details?: Record<string, unknown>) {
		super(message, 409, 'CONFLICT', details);
		this.name = 'ConflictError';
	}
}

export class RateLimitError extends ApiError {
	constructor(message = 'Too many requests. Please try again shortly.', details?: Record<string, unknown>) {
		super(message, 429, 'RATE_LIMITED', details);
		this.name = 'RateLimitError';
	}
}

export class ServerError extends ApiError {
	constructor(
		message = 'An internal server error occurred. Please try again later.',
		details?: Record<string, unknown>
	) {
		super(message, 500, 'SERVER_ERROR', details);
		this.name = 'ServerError';
	}
}

export class NetworkError extends ApiError {
	constructor(message = 'Unable to connect to the server. Please check your network connection.') {
		super(message, 0, 'NETWORK_ERROR');
		this.name = 'NetworkError';
	}
}
