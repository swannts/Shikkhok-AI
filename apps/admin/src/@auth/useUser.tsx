import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { User } from './user';

export function useUser() {
	const { user, status, logout } = useAuth();

	const data: User | null = useMemo(() => {
		if (!user) return null;

		return {
			id: user._id,
			role: [user.role],
			displayName: user.name,
			email: user.email || user.phone || '',
			shortcuts: [],
			settings: {}
		};
	}, [user]);

	const isGuest = status !== 'authenticated';

	return {
		data,
		isGuest,
		updateUser: async () => data ?? undefined,
		updateUserSettings: async (settings: User['settings']) => settings,
		signOut: logout
	};
}

export default useUser;
