'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { aiAdminService, AiHealthResponse, IngestionStatsResponse } from '@/features/ai/services/ai-admin.service';

export default function AiTelemetryPage() {
	const [health, setHealth] = useState<AiHealthResponse | null>(null);
	const [stats, setStats] = useState<IngestionStatsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [pinging, setPinging] = useState(false);
	const [latency, setLatency] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			setError(null);
			const startTime = performance.now();
			const [healthRes, statsRes] = await Promise.all([
				aiAdminService.getHealth().catch(() => ({
					enabled: true,
					healthy: false,
					status: 'unhealthy' as const,
					timestamp: new Date().toISOString()
				})),
				aiAdminService.getStats().catch(() => ({
					total_chunks: 0,
					total_documents: 0,
					books: []
				}))
			]);
			const endTime = performance.now();
			setLatency(Math.round(endTime - startTime));
			setHealth(healthRes);
			setStats(statsRes);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to fetch AI telemetry data';
			setError(msg);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, 30000); // 30s auto-refresh
		return () => clearInterval(interval);
	}, [fetchData]);

	const handlePing = async () => {
		setPinging(true);
		const start = performance.now();
		try {
			const res = await aiAdminService.getHealth();
			setLatency(Math.round(performance.now() - start));
			setHealth(res);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			setError('Health ping failed: ' + msg);
		} finally {
			setPinging(false);
		}
	};

	return (
		<div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
				<div className="flex items-center space-x-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shadow-sm">
						<FuseSvgIcon size={28}>heroicons-outline:cpu-chip</FuseSvgIcon>
					</div>
					<div>
						<Typography
							variant="h4"
							className="font-extrabold tracking-tight"
						>
							AI System Telemetry
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							FastAPI Microservice Health, Vector Store Statistics, & RAG Observability
						</Typography>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Button
						variant="outlined"
						color="primary"
						startIcon={<FuseSvgIcon size={18}>heroicons-outline:arrow-path</FuseSvgIcon>}
						onClick={handlePing}
						disabled={pinging || loading}
					>
						{pinging ? 'Pinging...' : 'Ping AI Service'}
					</Button>
				</div>
			</div>

			{error && (
				<Alert
					severity="warning"
					className="mb-6 rounded-xl"
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<CircularProgress size={48} />
				</div>
			) : (
				<>
					{/* Status Overview Cards */}
					<Grid
						container
						spacing={3}
						className="mb-8"
					>
						{/* Service Status */}
						<Grid
							item
							xs={12}
							sm={6}
							md={3}
						>
							<Card className="rounded-2xl border border-divider shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<Typography
											variant="subtitle2"
											color="text.secondary"
											className="font-semibold uppercase tracking-wider"
										>
											AI Service Health
										</Typography>
										<Chip
											label={health?.healthy ? 'HEALTHY' : 'UNREACHABLE'}
											color={health?.healthy ? 'success' : 'error'}
											size="small"
											className="font-bold text-xs"
										/>
									</div>
									<Typography
										variant="h4"
										className="font-black text-text-primary mb-1"
									>
										{health?.healthy ? 'Online' : 'Offline'}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Port 8000 (Internal HMAC Auth)
									</Typography>
								</CardContent>
							</Card>
						</Grid>

						{/* Latency */}
						<Grid
							item
							xs={12}
							sm={6}
							md={3}
						>
							<Card className="rounded-2xl border border-divider shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<Typography
											variant="subtitle2"
											color="text.secondary"
											className="font-semibold uppercase tracking-wider"
										>
											Gateway Latency
										</Typography>
										<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
											<FuseSvgIcon size={16}>heroicons-outline:bolt</FuseSvgIcon>
										</div>
									</div>
									<Typography
										variant="h4"
										className="font-black text-text-primary mb-1"
									>
										{latency !== null ? `${latency} ms` : '—'}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Round-trip via AiGatewayService
									</Typography>
								</CardContent>
							</Card>
						</Grid>

						{/* Vector Store Total Chunks */}
						<Grid
							item
							xs={12}
							sm={6}
							md={3}
						>
							<Card className="rounded-2xl border border-divider shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<Typography
											variant="subtitle2"
											color="text.secondary"
											className="font-semibold uppercase tracking-wider"
										>
											Indexed Chunks
										</Typography>
										<div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
											<FuseSvgIcon size={16}>heroicons-outline:circle-stack</FuseSvgIcon>
										</div>
									</div>
									<Typography
										variant="h4"
										className="font-black text-emerald-600 dark:text-emerald-400 mb-1"
									>
										{stats?.total_chunks ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Semantic Vector Embeddings
									</Typography>
								</CardContent>
							</Card>
						</Grid>

						{/* Total Indexed Textbooks */}
						<Grid
							item
							xs={12}
							sm={6}
							md={3}
						>
							<Card className="rounded-2xl border border-divider shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<Typography
											variant="subtitle2"
											color="text.secondary"
											className="font-semibold uppercase tracking-wider"
										>
											Curriculum Books
										</Typography>
										<div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
											<FuseSvgIcon size={16}>heroicons-outline:book-open</FuseSvgIcon>
										</div>
									</div>
									<Typography
										variant="h4"
										className="font-black text-amber-600 dark:text-amber-400 mb-1"
									>
										{stats?.books?.length ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										NCTB Classes 6–10 Active Sets
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					</Grid>

					{/* Model and Pipeline Architecture Summary */}
					<Grid
						container
						spacing={3}
						className="mb-8"
					>
						<Grid
							item
							xs={12}
							md={6}
						>
							<Paper className="p-6 rounded-2xl border border-divider shadow-sm h-full">
								<Typography
									variant="h6"
									className="font-bold mb-4 flex items-center gap-2"
								>
									<FuseSvgIcon size={20}>heroicons-outline:sparkles</FuseSvgIcon>
									Active AI Model Configuration
								</Typography>
								<div className="space-y-4 text-sm">
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">Primary LLM Engine</span>
										<span className="font-bold text-text-primary font-mono">gemini-1.5-pro</span>
									</div>
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">Embedding Model</span>
										<span className="font-bold text-text-primary font-mono">
											text-embedding-004 (768-dim)
										</span>
									</div>
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">
											Fallback Router Strategy
										</span>
										<span className="font-bold text-emerald-600">
											ModelRouter (Primary + Fallback)
										</span>
									</div>
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">Streaming Output Safety</span>
										<span className="font-bold text-emerald-600">
											Active (40-char lookahead buffer)
										</span>
									</div>
									<div className="flex justify-between py-2">
										<span className="text-text-secondary font-medium">
											Internal Security Protocol
										</span>
										<span className="font-bold text-text-primary">
											HMAC-SHA256 (Signed Headers)
										</span>
									</div>
								</div>
							</Paper>
						</Grid>

						<Grid
							item
							xs={12}
							md={6}
						>
							<Paper className="p-6 rounded-2xl border border-divider shadow-sm h-full">
								<Typography
									variant="h6"
									className="font-bold mb-4 flex items-center gap-2"
								>
									<FuseSvgIcon size={20}>heroicons-outline:clock</FuseSvgIcon>
									Gateway Streaming Timeouts
								</Typography>
								<div className="space-y-4 text-sm">
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">
											Connection Handshake Timeout
										</span>
										<span className="font-bold text-text-primary font-mono">5,000 ms</span>
									</div>
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">
											First-Token Latency Timeout
										</span>
										<span className="font-bold text-text-primary font-mono">15,000 ms</span>
									</div>
									<div className="flex justify-between py-2 border-b border-divider">
										<span className="text-text-secondary font-medium">
											Stream Idle Window (Per Chunk)
										</span>
										<span className="font-bold text-text-primary font-mono">20,000 ms</span>
									</div>
									<div className="flex justify-between py-2">
										<span className="text-text-secondary font-medium">
											Max Response Duration Cap
										</span>
										<span className="font-bold text-text-primary font-mono">120,000 ms</span>
									</div>
								</div>
							</Paper>
						</Grid>
					</Grid>

					{/* Vector Store Textbook Collections Table */}
					<Paper className="p-6 rounded-2xl border border-divider shadow-sm">
						<div className="flex items-center justify-between mb-4">
							<div>
								<Typography
									variant="h6"
									className="font-bold"
								>
									Curriculum Vector Store Collections
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Indexed textbook chunk distribution for grounded RAG retrieval
								</Typography>
							</div>
						</div>

						{stats?.books && stats.books.length > 0 ? (
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell className="font-bold">Book ID</TableCell>
											<TableCell className="font-bold text-right">Indexed Chunks</TableCell>
											<TableCell className="font-bold text-right">Grounding Status</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{stats.books.map((book) => (
											<TableRow
												key={book.book_id}
												hover
											>
												<TableCell className="font-mono font-medium">{book.book_id}</TableCell>
												<TableCell className="text-right font-bold">
													{book.chunk_count}
												</TableCell>
												<TableCell className="text-right">
													<Chip
														label="ACTIVE"
														color="success"
														size="small"
														className="text-xs font-bold"
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						) : (
							<div className="text-center py-8 text-text-secondary">
								<Typography variant="body2">
									No vector store books indexed yet. Go to Curriculum Ingestion to index NCTB
									textbooks.
								</Typography>
							</div>
						)}
					</Paper>
				</>
			)}
		</div>
	);
}
