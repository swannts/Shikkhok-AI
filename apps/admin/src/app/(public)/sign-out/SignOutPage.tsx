'use client';

import { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

export default function SignOutPage() {
  const { logout, status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      logout();
    }
  }, [status, logout]);

  return (
    <div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center p-4">
      <Paper className="flex min-h-full w-full items-center rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
        <div className="flex flex-col items-center mx-auto w-full max-w-80 sm:mx-0 sm:w-80 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mb-4">
            S
          </div>

          <Typography className="text-2xl font-extrabold tracking-tight">
            You have signed out
          </Typography>

          <Typography className="mt-4 text-sm" color="text.secondary">
            Return to{' '}
            <Link className="text-primary-500 font-semibold hover:underline" href="/sign-in">
              sign in
            </Link>
          </Typography>
        </div>
      </Paper>
    </div>
  );
}
