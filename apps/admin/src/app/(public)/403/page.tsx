'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useAuth } from '@/lib/auth/auth-context';

export default function ForbiddenPage() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center p-6 md:p-12 min-h-screen bg-background-default">
      <Paper className="w-full max-w-lg p-8 md:p-12 text-center rounded-2xl shadow-lg border border-divider">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error-50 text-error-600">
          <Typography className="text-4xl font-extrabold">403</Typography>
        </div>

        <Typography className="text-2xl font-bold text-text-primary tracking-tight mb-2">
          Access Denied
        </Typography>

        <Typography className="text-base text-text-secondary leading-relaxed mb-4">
          You do not have permission to access the Shikkhok-AI Admin Panel.
        </Typography>

        {user && (
          <Box className="mb-6 rounded-lg bg-surface p-4 text-left text-sm border border-divider">
            <Typography variant="body2" color="text.secondary">
              Logged in as: <strong>{user.email || user.phone || user.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assigned Role: <strong className="uppercase text-primary-600">{user.role}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" className="mt-1 block">
              Only accounts with the <code>admin</code> role are authorized to view this console.
            </Typography>
          </Box>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Button
            variant="contained"
            color="primary"
            size="large"
            className="w-full sm:w-auto px-6 font-semibold"
            onClick={logout}
          >
            Sign out & Switch Account
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            className="w-full sm:w-auto px-6"
            href="/sign-in"
          >
            Return to Login
          </Button>
        </div>
      </Paper>
    </div>
  );
}
