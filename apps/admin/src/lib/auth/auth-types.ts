export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface AdminUser {
	_id: string;
	name: string;
	email?: string;
	phone?: string;
	role: UserRole;
	status: UserStatus;
	createdAt?: string;
	updatedAt?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden';

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface LoginResponse {
	user: AdminUser;
	tokens: AuthTokens;
}

export interface AuthState {
	status: AuthStatus;
	user: AdminUser | null;
	errorMessage: string | null;
}
