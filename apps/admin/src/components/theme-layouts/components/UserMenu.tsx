import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { darken } from '@mui/material/styles';
import { alpha } from '@mui/system/colorManipulator';
import Tooltip from '@mui/material/Tooltip';
import clsx from 'clsx';
import Popover, { PopoverProps } from '@mui/material/Popover/Popover';
import { useAuth } from '@/lib/auth/auth-context';

type UserMenuProps = {
	className?: string;
	popoverProps?: Partial<PopoverProps>;
	arrowIcon?: string;
};

/**
 * The admin user menu displaying current administrator details and logout action.
 */
function UserMenu(props: UserMenuProps) {
	const { className, popoverProps, arrowIcon = 'heroicons-outline:chevron-up' } = props;
	const { user, logout } = useAuth();
	const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);

	const userMenuClick = (event: React.MouseEvent<HTMLElement>) => {
		setUserMenu(event.currentTarget);
	};

	const userMenuClose = () => {
		setUserMenu(null);
	};

	if (!user) {
		return null;
	}

	const initial = user.name ? user.name[0].toUpperCase() : 'A';
	const roleDisplay = user.role.toUpperCase();

	return (
		<>
			<Button
				className={clsx(
					'user-menu flex justify-start shrink-0 min-h-14 h-14 rounded-lg p-2 space-x-3',
					className
				)}
				sx={(theme) => ({
					borderColor: theme.palette.divider,
					'&:hover, &:focus': {
						backgroundColor: alpha(theme.palette.divider, 0.6),
						...theme.applyStyles('dark', {
							backgroundColor: alpha(theme.palette.divider, 0.1)
						})
					}
				})}
				onClick={userMenuClick}
				color="inherit"
			>
				<Avatar
					sx={(theme) => ({
						background: (th) => darken(th.palette.background.default, 0.05),
						color: theme.palette.text.secondary,
						fontWeight: 600
					})}
					className="avatar md:mx-1"
				>
					{initial}
				</Avatar>

				<div className="flex flex-col flex-auto space-y-1 text-left">
					<Typography
						component="span"
						className="title flex font-semibold text-sm capitalize truncate tracking-tight leading-none"
					>
						{user.name}
					</Typography>
					<Typography
						className="subtitle flex text-xs font-medium tracking-tight leading-none"
						color="text.secondary"
					>
						{user.email || user.phone}
					</Typography>
				</div>

				<div className="flex shrink-0 items-center space-x-2">
					<Tooltip title={`Role: ${roleDisplay}`}>
						<span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
							{roleDisplay}
						</span>
					</Tooltip>
					<FuseSvgIcon
						className="arrow"
						size={13}
					>
						{arrowIcon}
					</FuseSvgIcon>
				</div>
			</Button>

			<Popover
				open={Boolean(userMenu)}
				anchorEl={userMenu}
				onClose={userMenuClose}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'center'
				}}
				transformOrigin={{
					vertical: 'bottom',
					horizontal: 'center'
				}}
				classes={{
					paper: 'py-2 min-w-64'
				}}
				{...popoverProps}
			>
				<div className="px-4 py-2 border-b border-divider mb-1">
					<Typography
						variant="subtitle2"
						className="font-semibold"
					>
						{user.name}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
					>
						{user.email || user.phone}
					</Typography>
				</div>

				<MenuItem
					onClick={() => {
						userMenuClose();
						logout();
					}}
				>
					<ListItemIcon className="min-w-9">
						<FuseSvgIcon>heroicons-outline:arrow-right-on-rectangle</FuseSvgIcon>
					</ListItemIcon>
					<ListItemText primary="Sign out" />
				</MenuItem>
			</Popover>
		</>
	);
}

export default UserMenu;
