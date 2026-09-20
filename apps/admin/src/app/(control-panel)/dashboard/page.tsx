"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  adminAdminService,
  AdminMetrics,
} from "@/features/admin/services/admin-admin.service";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAdminService
      .getMetrics()
      .then(setMetrics)
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load platform metrics",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const cards = metrics
    ? [
        [
          "Total users",
          metrics.users.total.toLocaleString(),
          "Registered platform accounts",
        ],
        [
          "Active last 24h",
          metrics.users.activeLast24h.toLocaleString(),
          "Users with recent activity",
        ],
        [
          "Active subscribers",
          metrics.commercial.activeSubscribers.toLocaleString(),
          "Subscriptions currently active",
        ],
        [
          "Revenue",
          `৳${Number(metrics.commercial.totalRevenueBdt).toLocaleString()}`,
          "Completed payment transactions",
        ],
      ]
    : [];

  return (
    <div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
      <div className="mb-8">
        <Typography variant="h4" className="font-extrabold tracking-tight">
          Platform Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Live platform metrics from the admin API.
        </Typography>
      </div>
      {error && (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      )}
      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress />
        </div>
      ) : metrics ? (
        <>
          <Grid container spacing={3} className="mb-8">
            {cards.map(([label, value, description]) => (
              <Grid item xs={12} sm={6} md={3} key={label}>
                <Card className="rounded-2xl border border-divider shadow-sm h-full">
                  <CardContent className="p-6">
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h4" className="font-black my-2">
                      {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper className="p-6 rounded-2xl border border-divider shadow-sm">
                <Typography variant="h6" className="font-bold mb-4">
                  Users by role
                </Typography>
                <div className="space-y-3">
                  {Object.entries(metrics.users.byRole).map(([role, count]) => (
                    <div
                      key={role}
                      className="flex justify-between border-b border-divider pb-2"
                    >
                      <Typography>{role}</Typography>
                      <Typography className="font-bold">
                        {count.toLocaleString()}
                      </Typography>
                    </div>
                  ))}
                </div>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className="p-6 rounded-2xl border border-divider shadow-sm">
                <Typography variant="h6" className="font-bold mb-4">
                  Academic activity
                </Typography>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Typography>Total exams taken</Typography>
                    <Typography className="font-bold">
                      {metrics.academics.totalExamsTaken.toLocaleString()}
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography>Homework submissions</Typography>
                    <Typography className="font-bold">
                      {metrics.academics.totalHomeworkSubmissions.toLocaleString()}
                    </Typography>
                  </div>
                </div>
              </Paper>
            </Grid>
          </Grid>
          <Typography
            variant="caption"
            color="text.secondary"
            className="block mt-6"
          >
            Generated {new Date(metrics.generatedAt).toLocaleString()}
          </Typography>
        </>
      ) : null}
    </div>
  );
}
