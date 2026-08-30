'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/api-client';
import { TokenStorage } from './token-storage';
import { AdminUser, AuthState, LoginResponse } from './auth-types';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors/api-errors';

export interface AuthContextValue extends AuthState {
	isAdmin: boolean;
	login: (identifier: string, password: string) => Promise<AdminUser>;
	logout: () => Promise<void>;
	restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({
		status: 'loading',
		user: null,
		errorMessage: null
	});

	const router = useRouter();

	const handleSessionExpired = useCallback(() => {
		TokenStorage.clear();
		setState({
			status: 'unauthenticated',
			user: null,
			errorMessage: 'Your session has expired. Please sign in again.'
		});
	}, []);

	useEffect(() => {
		const unsubscribe = apiClient.onSessionExpired(handleSessionExpired);
		return () => unsubscribe();
	}, [handleSessionExpired]);

	const restoreSession = useCallback(async () => {
		setState((prev) => ({ ...prev, status: 'loading', errorMessage: null }));

		const refreshToken = TokenStorage.getRefreshToken();

		if (!refreshToken) {
			setState({
				status: 'unauthenticated',
				user: null,
				errorMessage: null
			});
			return;
		}

		try {
			// First attempt to get profile using in-memory access token or auto-refresh
			const profile = await apiClient.get<AdminUser>('/auth/me');

			if (profile.role === 'admin') {
				setState({
					status: 'authenticated',
					user: profile,
					errorMessage: null
				});
			} else {
				// Cleanly reject non-admin sessions
				TokenStorage.clear();
				setState({
					status: 'forbidden',
					user: profile,
					errorMessage: 'You do not have permission to access the Shikkhok-AI Admin Panel.'
				});
			}
		} catch {
			TokenStorage.clear();
			setState({
				status: 'unauthenticated',
				user: null,
				errorMessage: null
			});
		}
	}, []);

	useEffect(() => {
		restoreSession();
	}, [restoreSession]);

	const login = useCallback(async (identifier: string, password: string): Promise<AdminUser> => {
		setState((prev) => ({ ...prev, errorMessage: null }));

		try {
			const response = await apiClient.post<LoginResponse>(
				'/auth/login',
				{ identifier, password },
				{ skipAuth: true }
			);

			const { tokens } = response;

			if (!tokens?.accessToken) {
				throw new UnauthorizedError('Authentication failed: missing access token.');
			}

			// Store tokens
			TokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

			// Fetch authoritative current user identity from /auth/me
			const authoritativeUser = await apiClient.get<AdminUser>('/auth/me');

			if (authoritativeUser.role !== 'admin') {
				// Reject non-admin cleanly: clear tokens, state, and throw ForbiddenError
				TokenStorage.clear();
				setState({
					status: 'forbidden',
					user: authoritativeUser,
					errorMessage: 'You do not have permission to access the Shikkhok-AI Admin Panel.'
				});
				throw new ForbiddenError('You do not have permission to access the Shikkhok-AI Admin Panel.');
			}

			setState({
				status: 'authenticated',
				user: authoritativeUser,
				errorMessage: null
			});

			return authoritativeUser;
		} catch (err) {
			if (err instanceof ForbiddenError) {
				throw err;
			}

			const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
			setState((prev) => ({
				...prev,
				status: 'unauthenticated',
				errorMessage: message
			}));
			throw err;
		}
	}, []);

	const logout = useCallback(async () => {
		const refreshToken = TokenStorage.getRefreshToken();
		try {
			if (refreshToken) {
				await apiClient.post('/auth/logout', { refreshToken });
			}
		} catch {
			// Ignore network errors on logout to ensure local session still cleans up safely
		} finally {
			TokenStorage.clear();
			setState({
				status: 'unauthenticated',
				user: null,
				errorMessage: null
			});
			router.push('/sign-in');
		}
	}, [router]);

	const isAdmin = useMemo(() => {
		return state.status === 'authenticated' && state.user?.role === 'admin';
	}, [state.status, state.user?.role]);

	const value = useMemo<AuthContextValue>(
		() => ({
			...state,
			isAdmin,
			login,
			logout,
			restoreSession
		}),
		[state, isAdmin, login, logout, restoreSession]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const defaultAuthValue: AuthContextValue = {
	status: 'unauthenticated',
	user: null,
	errorMessage: null,
	isAdmin: false,
	login: async () => {
		throw new Error('AuthProvider is not mounted.');
	},
	logout: async () => {},
	restoreSession: async () => {}
};

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	return context ?? defaultAuthValue;
}
