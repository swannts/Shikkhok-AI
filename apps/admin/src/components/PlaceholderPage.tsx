'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

interface PlaceholderPageProps {
  title: string;
  icon: string;
  phase: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  icon,
  phase,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <FuseSvgIcon size={28}>{icon}</FuseSvgIcon>
          </div>
          <div>
            <Typography variant="h4" className="font-extrabold tracking-tight">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shikkhok-AI Admin Console
            </Typography>
          </div>
        </div>

        <Chip
          label={phase}
          color="primary"
          variant="outlined"
          size="medium"
          className="font-semibold"
        />
      </div>

      <Paper className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-divider shadow-sm min-h-[380px]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
          <FuseSvgIcon size={32}>{icon}</FuseSvgIcon>
        </div>
        <Typography variant="h6" className="font-bold text-text-primary mb-2">
          {title} Placeholder
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          className="max-w-md mb-6 leading-relaxed"
        >
          {description}
        </Typography>
        <Box className="rounded-lg bg-surface px-4 py-2 text-xs font-mono text-text-secondary border border-divider">
          Status: Planned for subsequent phase
        </Box>
      </Paper>
    </div>
  );
}
