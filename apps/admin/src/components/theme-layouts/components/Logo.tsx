'use client';

import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Link from 'next/link';

const Root = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  '&:hover': {
    textDecoration: 'none',
  },
}));

/**
 * Shikkhok-AI Admin Console Logo component.
 */
function Logo() {
  return (
    <Root href="/dashboard" className="flex flex-1 items-center space-x-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-lg shadow-sm">
        S
      </div>
      <div className="logo-text flex flex-col flex-auto">
        <Typography className="text-lg tracking-tight font-extrabold leading-none text-text-primary">
          Shikkhok-AI
        </Typography>
        <Typography
          className="text-[11px] tracking-wider font-bold leading-none mt-1 uppercase text-primary-500"
        >
          Admin Console
        </Typography>
      </div>
    </Root>
  );
}

export default Logo;
