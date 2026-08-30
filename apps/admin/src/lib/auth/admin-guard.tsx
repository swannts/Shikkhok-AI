'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuth } from './auth-context';

export interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { status, user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/sign-in');
      return;
    }

    if (status === 'forbidden' || (status === 'authenticated' && !isAdmin)) {
      router.replace('/403');
    }
  }, [status, isAdmin, user, router]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          gap: 2,
        }}
      >
        <CircularProgress size={48} color="primary" />
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          Verifying administrator credentials...
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return null; // Navigation redirect handled in useEffect
  }

  return <>{children}</>;
}

export default AdminGuard;
