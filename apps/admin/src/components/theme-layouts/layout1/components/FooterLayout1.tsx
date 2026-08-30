import AppBar from '@mui/material/AppBar';
import { ThemeProvider } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import clsx from 'clsx';
import { useFooterTheme } from '@fuse/core/FuseSettings/hooks/fuseThemeHooks';

type FooterLayout1Props = { className?: string };

/**
 * The footer layout 1 for Shikkhok-AI Admin Console.
 */
function FooterLayout1(props: FooterLayout1Props) {
	const { className } = props;
	const footerTheme = useFooterTheme();

	return (
		<ThemeProvider theme={footerTheme}>
			<AppBar
				id="fuse-footer"
				className={clsx('relative z-20 border-t', className)}
				color="default"
				sx={(theme) => ({
					backgroundColor: footerTheme.palette.background.default,
					...theme.applyStyles('light', {
						backgroundColor: footerTheme.palette.background.paper
					})
				})}
				elevation={0}
			>
				<Toolbar className="min-h-12 md:min-h-14 px-4 py-0 flex items-center justify-between text-xs text-text-secondary">
					<Typography
						variant="caption"
						color="text.secondary"
					>
						© {new Date().getFullYear()} Shikkhok-AI. All rights reserved.
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						className="font-mono"
					>
						Admin Console v1.0.0
					</Typography>
				</Toolbar>
			</AppBar>
		</ThemeProvider>
	);
}

export default memo(FooterLayout1);
