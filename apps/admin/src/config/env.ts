/**
 * Typed environment configuration module for Shikkhok-AI Admin Console.
 * Centralizes all environment variable access.
 */
export const ENV = {
	apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:3000/api/v1',
	appName: 'Shikkhok-AI Admin Console',
	isProduction: process.env.NODE_ENV === 'production',
	isDevelopment: process.env.NODE_ENV !== 'production'
} as const;

export type Environment = typeof ENV;
