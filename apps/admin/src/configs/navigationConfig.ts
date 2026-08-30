import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * Navigation configuration for Shikkhok-AI Admin Console Phase 1.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'dashboard',
		title: 'Dashboard',
		type: 'item',
		icon: 'heroicons-outline:squares-2x2',
		url: '/dashboard'
	},
	{
		id: 'users',
		title: 'Users',
		type: 'item',
		icon: 'heroicons-outline:users',
		url: '/users'
	},
	{
		id: 'curriculum',
		title: 'Curriculum',
		type: 'item',
		icon: 'heroicons-outline:book-open',
		url: '/curriculum'
	},
	{
		id: 'payments',
		title: 'Payments',
		type: 'item',
		icon: 'heroicons-outline:banknotes',
		url: '/payments'
	},
	{
		id: 'audit-logs',
		title: 'Audit Logs',
		type: 'item',
		icon: 'heroicons-outline:clipboard-document-list',
		url: '/audit-logs'
	}
];

export default navigationConfig;
