'use client';

import { ElementType, useImperativeHandle, useRef, useState } from 'react';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import FuseSvgIcon from '../FuseSvgIcon';

type FuseHighlightProps = {
	async?: boolean;
	children: string | { default?: string };
	component?: ElementType;
	className?: string;
	copy?: boolean;
	ref?: React.RefObject<HTMLDivElement>;
};

function trimCode(children: string | { default?: string }) {
	const source = typeof children === 'string' ? children : children?.default ?? '';
	return source.trim();
}

/**
 * FuseHighlight
 * Renders formatted code block with copy action.
 */
function FuseHighlight(props: FuseHighlightProps) {
	const { copy = true, children, className, component: Wrapper = 'code', ref } = props;
	const innerRef = useRef<HTMLDivElement>(null);
	useImperativeHandle(ref, () => innerRef.current, [innerRef]);
	const [open, setOpen] = useState(false);
	const source = trimCode(children);

	function handleCopy() {
		navigator.clipboard.writeText(source);
		setOpen(true);
		setTimeout(() => setOpen(false), 800);
	}

	return (
		<div className={clsx('relative not-prose font-mono text-sm', className)}>
			{copy && (
				<Tooltip
					title="Copied"
					open={open}
					leaveDelay={1500}
				>
					<Button
						aria-label="copy"
						className="absolute top-0 right-0 z-10 mr-4 mt-4 h-8 min-h-8"
						onClick={handleCopy}
					>
						<FuseSvgIcon size={16}>heroicons-outline:clipboard</FuseSvgIcon>
					</Button>
				</Tooltip>
			)}
			<Wrapper
				ref={innerRef}
				className="block overflow-x-auto p-4 rounded bg-slate-900 text-slate-100"
			>
				{source}
			</Wrapper>
		</div>
	);
}

export default FuseHighlight;
