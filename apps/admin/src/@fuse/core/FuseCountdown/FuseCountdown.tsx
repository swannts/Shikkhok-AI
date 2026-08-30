'use client';

import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

type FuseCountdownProps = {
	onComplete?: () => void;
	endDate?: Date | string | number;
	className?: string;
};

/**
 * FuseCountdown
 * Displays days, hours, minutes, and seconds left until a specified end date.
 */
function FuseCountdown(props: FuseCountdownProps) {
	const { onComplete, endDate = new Date(Date.now() + 15 * 86400000), className } = props;

	const endTimestamp = typeof endDate === 'number' ? endDate : new Date(endDate).getTime();

	const [countdown, setCountdown] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	});

	const intervalRef = useRef<number | null>(null);

	const complete = useCallback(() => {
		if (intervalRef.current) {
			window.clearInterval(intervalRef.current);
		}

		if (onComplete) {
			onComplete();
		}
	}, [onComplete]);

	const tick = useCallback(() => {
		const diffSeconds = Math.floor((endTimestamp - Date.now()) / 1000);

		if (diffSeconds < 0) {
			complete();
			return;
		}

		const days = Math.floor(diffSeconds / 86400);
		const hours = Math.floor((diffSeconds % 86400) / 3600);
		const minutes = Math.floor((diffSeconds % 3600) / 60);
		const seconds = diffSeconds % 60;

		setCountdown({
			days,
			hours,
			minutes,
			seconds
		});
	}, [complete, endTimestamp]);

	useEffect(() => {
		intervalRef.current = window.setInterval(tick, 1000);
		tick();

		return () => {
			if (intervalRef.current) {
				window.clearInterval(intervalRef.current);
			}
		};
	}, [tick]);

	return (
		<div className={clsx('flex items-center space-x-4 text-center', className)}>
			<div className="flex flex-col">
				<Typography
					variant="h4"
					className="font-bold"
				>
					{countdown.days}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
				>
					Days
				</Typography>
			</div>
			<div className="flex flex-col">
				<Typography
					variant="h4"
					className="font-bold"
				>
					{countdown.hours}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
				>
					Hours
				</Typography>
			</div>
			<div className="flex flex-col">
				<Typography
					variant="h4"
					className="font-bold"
				>
					{countdown.minutes}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
				>
					Minutes
				</Typography>
			</div>
			<div className="flex flex-col">
				<Typography
					variant="h4"
					className="font-bold"
				>
					{countdown.seconds}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
				>
					Seconds
				</Typography>
			</div>
		</div>
	);
}

export default memo(FuseCountdown);
