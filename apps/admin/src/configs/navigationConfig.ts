import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/** Navigation exposes only admin capabilities currently backed by real APIs. */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'dashboard',
		title: 'Dashboard',
		type: 'item',
		icon: 'heroicons-outline:squares-2x2',
		url: '/dashboard'
	},
	{
		id: 'people',
		title: 'People',
		type: 'group',
		icon: 'heroicons-outline:users',
		children: [{ id: 'users', title: 'Users', type: 'item', url: '/users' }]
	},
	{
		id: 'curriculum-group',
		title: 'Curriculum',
		type: 'group',
		icon: 'heroicons-outline:book-open',
		children: [{ id: 'curriculum', title: 'Overview', type: 'item', url: '/curriculum' }]
	},
	{
		id: 'ai-knowledge',
		title: 'AI & Knowledge',
		type: 'group',
		icon: 'heroicons-outline:cpu-chip',
		children: [{ id: 'ai-telemetry', title: 'Overview', type: 'item', url: '/ai-telemetry' }]
	},
	{
		id: 'payments-group',
		title: 'Payments',
		type: 'group',
		icon: 'heroicons-outline:banknotes',
		children: [{ id: 'payments', title: 'Manual Verification', type: 'item', url: '/payments' }]
	},
	{
		id: 'security',
		title: 'Security',
		type: 'group',
		icon: 'heroicons-outline:shield-check',
		children: [{ id: 'audit-logs', title: 'Audit Logs', type: 'item', url: '/audit-logs' }]
	}
];

export default navigationConfig;
