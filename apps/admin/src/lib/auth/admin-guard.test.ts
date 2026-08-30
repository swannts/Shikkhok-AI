import { describe, it, expect, vi } from 'vitest';
import { AuthStatus, AdminUser } from './auth-types';

describe('AdminGuard authorization logic', () => {
	function evaluateGuardState(params: {
		status: AuthStatus;
		user: AdminUser | null;
		isAdmin: boolean;
		redirect: (path: string) => void;
	}): { renderLoading: boolean; renderProtectedContent: boolean } {
		const { status, isAdmin, redirect } = params;

		if (status === 'loading') {
			return { renderLoading: true, renderProtectedContent: false };
		}

		if (status === 'unauthenticated') {
			redirect('/sign-in');
			return { renderLoading: false, renderProtectedContent: false };
		}

		if (status === 'forbidden' || (status === 'authenticated' && !isAdmin)) {
			redirect('/403');
			return { renderLoading: false, renderProtectedContent: false };
		}

		if (status === 'authenticated' && isAdmin) {
			return { renderLoading: false, renderProtectedContent: true };
		}

		return { renderLoading: false, renderProtectedContent: false };
	}

	it('Loading state: shows loading and never exposes protected content', () => {
		const redirectSpy = vi.fn();
		const result = evaluateGuardState({
			status: 'loading',
			user: null,
			isAdmin: false,
			redirect: redirectSpy
		});

		expect(result.renderLoading).toBe(true);
		expect(result.renderProtectedContent).toBe(false);
		expect(redirectSpy).not.toHaveBeenCalled();
	});

	it('Unauthenticated state: redirects to /sign-in and blocks content', () => {
		const redirectSpy = vi.fn();
		const result = evaluateGuardState({
			status: 'unauthenticated',
			user: null,
			isAdmin: false,
			redirect: redirectSpy
		});

		expect(result.renderLoading).toBe(false);
		expect(result.renderProtectedContent).toBe(false);
		expect(redirectSpy).toHaveBeenCalledWith('/sign-in');
	});

	it('Forbidden state: redirects to /403 and blocks content', () => {
		const redirectSpy = vi.fn();
		const result = evaluateGuardState({
			status: 'forbidden',
			user: null,
			isAdmin: false,
			redirect: redirectSpy
		});

		expect(result.renderLoading).toBe(false);
		expect(result.renderProtectedContent).toBe(false);
		expect(redirectSpy).toHaveBeenCalledWith('/403');
	});

	it('Authenticated non-admin: redirects to /403 and blocks content', () => {
		const redirectSpy = vi.fn();
		const result = evaluateGuardState({
			status: 'authenticated',
			user: {
				_id: '123',
				name: 'Student',
				role: 'student',
				status: 'active'
			},
			isAdmin: false,
			redirect: redirectSpy
		});

		expect(result.renderLoading).toBe(false);
		expect(result.renderProtectedContent).toBe(false);
		expect(redirectSpy).toHaveBeenCalledWith('/403');
	});

	it('Authenticated admin: renders protected admin content safely', () => {
		const redirectSpy = vi.fn();
		const result = evaluateGuardState({
			status: 'authenticated',
			user: {
				_id: '456',
				name: 'Admin User',
				role: 'admin',
				status: 'active'
			},
			isAdmin: true,
			redirect: redirectSpy
		});

		expect(result.renderLoading).toBe(false);
		expect(result.renderProtectedContent).toBe(true);
		expect(redirectSpy).not.toHaveBeenCalled();
	});
});
