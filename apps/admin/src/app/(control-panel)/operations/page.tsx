'use client';

import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
	adminAdminService,
	FailedJob,
	PlatformHealth,
	QueueMetric
} from '@/features/admin/services/admin-admin.service';

export default function OperationsPage() {
	const [health, setHealth] = useState<PlatformHealth | null>(null);
	const [queues, setQueues] = useState<QueueMetric[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [retryingQueue, setRetryingQueue] = useState<string | null>(null);

	// Failed jobs dialog state
	const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
	const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
	const [loadingFailedJobs, setLoadingFailedJobs] = useState(false);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [healthRes, queuesRes] = await Promise.all([
				adminAdminService.getPlatformHealth(),
				adminAdminService.getQueueMetrics()
			]);
			setHealth(healthRes);
			setQueues(queuesRes.queues);
			setError(null);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load operations metrics');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
		// Auto refresh every 30 seconds
		const interval = setInterval(loadData, 30000);
		return () => clearInterval(interval);
	}, [loadData]);

	const viewFailedJobs = async (queueName: string) => {
		setSelectedQueue(queueName);
		setLoadingFailedJobs(true);
		try {
			const res = await adminAdminService.getFailedQueueJobs(queueName);
			setFailedJobs(res.jobs);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load failed queue jobs');
		} finally {
			setLoadingFailedJobs(false);
		}
	};

	const retryFailedJobs = async (queueName: string) => {
		if (!window.confirm(`Retry all failed jobs in queue "${queueName}"?`)) return;

		setRetryingQueue(queueName);
		setError(null);
		setSuccessMessage(null);
		try {
			const res = await adminAdminService.retryFailedQueueJobs(queueName);
			setSuccessMessage(res.message);
			await loadData();

			if (selectedQueue === queueName) {
				await viewFailedJobs(queueName);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Retry failed jobs action failed');
		} finally {
			setRetryingQueue(null);
		}
	};

	const formatUptime = (seconds: number) => {
		const days = Math.floor(seconds / 86400);
		const hrs = Math.floor((seconds % 86400) / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		return `${days > 0 ? `${days}d ` : ''}${hrs}h ${mins}m`;
	};

	return (
		<div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div>
					<Typography
						variant="h4"
						className="font-extrabold tracking-tight"
					>
						Platform Operations & Queues
					</Typography>
					<Typography
						variant="body2"
						color="text.secondary"
					>
						Real-time cluster health, service dependencies, and BullMQ background worker queues.
					</Typography>
				</div>
				<Button
					variant="outlined"
					onClick={loadData}
					disabled={loading}
				>
					Refresh Status
				</Button>
			</div>

			{error && (
				<Alert
					severity="error"
					className="mb-6"
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}

			{successMessage && (
				<Alert
					severity="success"
					className="mb-6"
					onClose={() => setSuccessMessage(null)}
				>
					{successMessage}
				</Alert>
			)}

			{loading && !health ? (
				<div className="flex justify-center py-16">
					<CircularProgress />
				</div>
			) : (
				<>
					{/* Platform Health Overview */}
					{health && (
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
							<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold uppercase tracking-wider"
								>
									System Status
								</Typography>
								<div className="flex items-center gap-2 mt-2">
									<Chip
										label={health.status.toUpperCase()}
										color={
											health.status === 'healthy'
												? 'success'
												: health.status === 'degraded'
													? 'warning'
													: 'error'
										}
										size="small"
										className="font-bold"
									/>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										Updated: {new Date(health.timestamp).toLocaleTimeString()}
									</Typography>
								</div>
							</Paper>

							<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold uppercase tracking-wider"
								>
									MongoDB Cluster
								</Typography>
								<div className="flex items-center gap-2 mt-2">
									<Chip
										label={health.services.mongodb.status.toUpperCase()}
										color={health.services.mongodb.status === 'up' ? 'success' : 'error'}
										size="small"
									/>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										Latency: {health.services.mongodb.latencyMs}ms
									</Typography>
								</div>
							</Paper>

							<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold uppercase tracking-wider"
								>
									Redis Cache & Pub/Sub
								</Typography>
								<div className="flex items-center gap-2 mt-2">
									<Chip
										label={health.services.redis.status.toUpperCase()}
										color={health.services.redis.status === 'up' ? 'success' : 'error'}
										size="small"
									/>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										Latency: {health.services.redis.latencyMs}ms
									</Typography>
								</div>
							</Paper>

							<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold uppercase tracking-wider"
								>
									Background Queues
								</Typography>
								<div className="flex items-center gap-2 mt-2">
									<Chip
										label={health.services.queues.status.toUpperCase()}
										color={health.services.queues.status === 'up' ? 'success' : 'error'}
										size="small"
									/>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{health.services.queues.totalWaiting} waiting ·{' '}
										{health.services.queues.totalFailed} failed
									</Typography>
								</div>
							</Paper>
						</div>
					)}

					{/* Queue Diagnostics Table */}
					<Paper className="rounded-2xl border border-divider shadow-sm overflow-hidden mb-6">
						<div className="p-4 border-b border-divider flex items-center justify-between">
							<Typography
								variant="h6"
								className="font-bold"
							>
								Background Worker Queues & Dead-Letter Queues (DLQ)
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Auto-refreshed: {new Date().toLocaleTimeString()}
							</Typography>
						</div>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Queue Name</TableCell>
										<TableCell align="center">Active</TableCell>
										<TableCell align="center">Waiting</TableCell>
										<TableCell align="center">Completed</TableCell>
										<TableCell align="center">Failed</TableCell>
										<TableCell align="center">Delayed</TableCell>
										<TableCell align="center">Status</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{queues.map((q) => (
										<TableRow
											key={q.name}
											hover
										>
											<TableCell className="font-semibold font-mono text-sm">{q.name}</TableCell>
											<TableCell align="center">
												<Chip
													label={q.counts.active}
													size="small"
													color={q.counts.active > 0 ? 'primary' : 'default'}
												/>
											</TableCell>
											<TableCell align="center">{q.counts.waiting}</TableCell>
											<TableCell align="center">{q.counts.completed.toLocaleString()}</TableCell>
											<TableCell align="center">
												{q.counts.failed > 0 ? (
													<Chip
														label={q.counts.failed}
														size="small"
														color="error"
														className="font-bold"
													/>
												) : (
													'0'
												)}
											</TableCell>
											<TableCell align="center">{q.counts.delayed}</TableCell>
											<TableCell align="center">
												<Chip
													label={q.isPaused ? 'PAUSED' : 'ACTIVE'}
													size="small"
													color={q.isPaused ? 'warning' : 'success'}
													variant="outlined"
												/>
											</TableCell>
											<TableCell align="right">
												<div className="flex items-center justify-end gap-2">
													{q.counts.failed > 0 && (
														<Button
															size="small"
															color="primary"
															variant="outlined"
															onClick={() => viewFailedJobs(q.name)}
														>
															View Failed
														</Button>
													)}
													<Button
														size="small"
														color="secondary"
														variant="contained"
														disabled={q.counts.failed === 0 || retryingQueue === q.name}
														onClick={() => retryFailedJobs(q.name)}
													>
														{retryingQueue === q.name ? 'Retrying…' : 'Retry Failed'}
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						{queues.length === 0 && (
							<Typography
								color="text.secondary"
								className="p-8 text-center"
							>
								No monitored queues available.
							</Typography>
						)}
					</Paper>
				</>
			)}

			{/* Failed Jobs Dialog */}
			<Dialog
				open={selectedQueue !== null}
				onClose={() => setSelectedQueue(null)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle className="flex justify-between items-center">
					<span>
						Failed Jobs in Queue: <span className="font-mono text-primary font-bold">{selectedQueue}</span>
					</span>
				</DialogTitle>
				<DialogContent dividers>
					{loadingFailedJobs ? (
						<div className="flex justify-center py-8">
							<CircularProgress size={32} />
						</div>
					) : failedJobs.length === 0 ? (
						<Typography
							color="text.secondary"
							className="py-4 text-center"
						>
							No failed jobs found in this queue.
						</Typography>
					) : (
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Job ID</TableCell>
										<TableCell>Job Name</TableCell>
										<TableCell>Failure Reason</TableCell>
										<TableCell align="center">Attempts</TableCell>
										<TableCell>Failed At</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{failedJobs.map((job) => (
										<TableRow key={job.id || Math.random()}>
											<TableCell className="font-mono text-xs">{job.id || '—'}</TableCell>
											<TableCell className="font-semibold">{job.name}</TableCell>
											<TableCell
												className="text-red-600 text-xs font-mono max-w-xs truncate"
												title={job.failedReason}
											>
												{job.failedReason || 'Unknown error'}
											</TableCell>
											<TableCell align="center">{job.attemptsMade}</TableCell>
											<TableCell className="text-xs">
												{job.timestamp ? new Date(job.timestamp).toLocaleString() : '—'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</DialogContent>
				<DialogActions>
					{selectedQueue && (
						<Button
							color="secondary"
							variant="contained"
							disabled={retryingQueue === selectedQueue}
							onClick={() => retryFailedJobs(selectedQueue)}
						>
							{retryingQueue === selectedQueue ? 'Retrying…' : 'Retry All in Queue'}
						</Button>
					)}
					<Button onClick={() => setSelectedQueue(null)}>Close</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
