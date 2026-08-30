'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { aiAdminService, IngestionStatsResponse, IngestTextbookPayload } from '@/features/ai/services/ai-admin.service';

const CLASS_LEVELS = [6, 7, 8, 9, 10];
const SUBJECTS = [
	{ id: 'mathematics', title: 'Mathematics (গণিত)' },
	{ id: 'science', title: 'General Science (সাধারণ বিজ্ঞান)' },
	{ id: 'english', title: 'English Grammar & Composition' },
	{ id: 'bangla', title: 'Bangla Sahitto (বাংলা সাহিত্য)' },
	{ id: 'physics', title: 'Physics (পদার্থবিজ্ঞান)' },
	{ id: 'chemistry', title: 'Chemistry (রসায়ন)' },
	{ id: 'biology', title: 'Biology (জীববিজ্ঞান)' }
];

export default function CurriculumIngestionPage() {
	const [stats, setStats] = useState<IngestionStatsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// Ingestion Dialog state
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const [formData, setFormData] = useState<IngestTextbookPayload>({
		source_book: 'NCTB গণিত (শ্রেণি ৮)',
		book_id: 'nctb_math_class_8',
		class_level: 8,
		subject_id: 'mathematics',
		subject_title: 'গণিত',
		chapter_id: 'algebra',
		chapter_title: 'বীজগণিতীয় রাশি',
		page_start: 45,
		page_end: 45,
		chunk_size: 300,
		chunk_overlap: 50,
		text: ''
	});

	const fetchStats = useCallback(async () => {
		try {
			setError(null);
			const data = await aiAdminService.getStats();
			setStats(data);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to load vector store statistics';
			setError(msg);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	const handleOpenDialog = () => {
		setOpenDialog(true);
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
		setFormData((prev) => ({ ...prev, text: '' }));
	};

	const handleIngest = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.text.trim()) {
			setError('Text content is required for ingestion.');
			return;
		}

		setSubmitting(true);
		setError(null);
		try {
			const res = await aiAdminService.ingestChunk(formData);
			setSuccessMsg(`Successfully indexed ${res.indexed_count ?? 1} chunk(s) for ${formData.book_id}`);
			handleCloseDialog();
			await fetchStats();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to ingest textbook chunk';
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteBook = async (bookId: string) => {
		if (!window.confirm(`Are you sure you want to delete all indexed vector chunks for "${bookId}"?`)) {
			return;
		}

		setDeletingId(bookId);
		setError(null);
		try {
			await aiAdminService.deleteBook(bookId);
			setSuccessMsg(`Deleted vector index for book "${bookId}"`);
			await fetchStats();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : `Failed to delete vector index for ${bookId}`;
			setError(msg);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
				<div className="flex items-center space-x-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm">
						<FuseSvgIcon size={28}>heroicons-outline:book-open</FuseSvgIcon>
					</div>
					<div>
						<Typography
							variant="h4"
							className="font-extrabold tracking-tight"
						>
							Curriculum & Vector Store
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							NCTB Textbook Ingestion, Semantic Chunking, & RAG Retrieval Management
						</Typography>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Button
						variant="contained"
						color="primary"
						startIcon={<FuseSvgIcon size={18}>heroicons-outline:plus</FuseSvgIcon>}
						onClick={handleOpenDialog}
						className="shadow-sm font-semibold"
					>
						Ingest Content
					</Button>
				</div>
			</div>

			{error && (
				<Alert
					severity="error"
					className="mb-6 rounded-xl"
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}

			{successMsg && (
				<Alert
					severity="success"
					className="mb-6 rounded-xl"
					onClose={() => setSuccessMsg(null)}
				>
					{successMsg}
				</Alert>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<CircularProgress size={48} />
				</div>
			) : (
				<>
					{/* Vector Store Stat Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
						<Paper className="p-6 rounded-2xl border border-divider shadow-sm">
							<Typography
								variant="subtitle2"
								color="text.secondary"
								className="font-semibold uppercase tracking-wider mb-2"
							>
								Total Vector Chunks
							</Typography>
							<Typography
								variant="h3"
								className="font-black text-emerald-600 dark:text-emerald-400"
							>
								{stats?.total_chunks ?? 0}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Active embeddings ready for AI Tutor retrieval
							</Typography>
						</Paper>

						<Paper className="p-6 rounded-2xl border border-divider shadow-sm">
							<Typography
								variant="subtitle2"
								color="text.secondary"
								className="font-semibold uppercase tracking-wider mb-2"
							>
								Total Documents
							</Typography>
							<Typography
								variant="h3"
								className="font-black text-blue-600 dark:text-blue-400"
							>
								{stats?.total_documents ?? 0}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Ingested pages and lesson sections
							</Typography>
						</Paper>

						<Paper className="p-6 rounded-2xl border border-divider shadow-sm">
							<Typography
								variant="subtitle2"
								color="text.secondary"
								className="font-semibold uppercase tracking-wider mb-2"
							>
								Indexed Textbook Sets
							</Typography>
							<Typography
								variant="h3"
								className="font-black text-purple-600 dark:text-purple-400"
							>
								{stats?.books?.length ?? 0}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Unique curriculum collections
							</Typography>
						</Paper>
					</div>

					{/* Indexed Textbooks Table */}
					<Paper className="p-6 rounded-2xl border border-divider shadow-sm">
						<div className="flex items-center justify-between mb-4">
							<div>
								<Typography
									variant="h6"
									className="font-bold"
								>
									Indexed Textbook Collections
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Manage curriculum vectors used to ground AI Tutor answers and generate citations
								</Typography>
							</div>
						</div>

						{stats?.books && stats.books.length > 0 ? (
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell className="font-bold">Book ID</TableCell>
											<TableCell className="font-bold text-right">Chunk Count</TableCell>
											<TableCell className="font-bold text-center">Status</TableCell>
											<TableCell className="font-bold text-right">Actions</TableCell>
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
												<TableCell className="text-center">
													<Chip
														label="INDEXED"
														color="success"
														size="small"
														className="text-xs font-bold"
													/>
												</TableCell>
												<TableCell className="text-right">
													<IconButton
														color="error"
														size="small"
														onClick={() => handleDeleteBook(book.book_id)}
														disabled={deletingId === book.book_id}
														title="Delete book index"
													>
														{deletingId === book.book_id ? (
															<CircularProgress size={18} />
														) : (
															<FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
														)}
													</IconButton>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						) : (
							<div className="text-center py-12">
								<FuseSvgIcon
									size={48}
									className="text-slate-300 mb-3"
								>
									heroicons-outline:book-open
								</FuseSvgIcon>
								<Typography
									variant="h6"
									className="font-bold text-text-secondary mb-1"
								>
									No Curriculum Textbooks Indexed
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									className="mb-4"
								>
									Click "Ingest Content" above or run the CLI batch ingestion script.
								</Typography>
							</div>
						)}
					</Paper>
				</>
			)}

			{/* Ingest Content Dialog Modal */}
			<Dialog
				open={openDialog}
				onClose={handleCloseDialog}
				maxWidth="md"
				fullWidth
			>
				<form onSubmit={handleIngest}>
					<DialogTitle className="font-bold">Ingest NCTB Textbook Content</DialogTitle>
					<DialogContent
						dividers
						className="space-y-4"
					>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<TextField
								label="Source Book Title"
								fullWidth
								required
								value={formData.source_book}
								onChange={(e) => setFormData({ ...formData, source_book: e.target.value })}
								placeholder="e.g. NCTB গণিত (শ্রেণি ৮)"
							/>

							<TextField
								label="Book Identifier (ID)"
								fullWidth
								required
								value={formData.book_id}
								onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
								placeholder="e.g. nctb_math_class_8"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<TextField
								select
								label="Class Level"
								fullWidth
								value={formData.class_level}
								onChange={(e) => setFormData({ ...formData, class_level: Number(e.target.value) })}
							>
								{CLASS_LEVELS.map((lvl) => (
									<MenuItem
										key={lvl}
										value={lvl}
									>
										Class {lvl} (শ্রেণি {lvl})
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Subject"
								fullWidth
								value={formData.subject_id}
								onChange={(e) => {
									const sub = SUBJECTS.find((s) => s.id === e.target.value);
									setFormData({
										...formData,
										subject_id: e.target.value,
										subject_title: sub ? sub.title : e.target.value
									});
								}}
							>
								{SUBJECTS.map((sub) => (
									<MenuItem
										key={sub.id}
										value={sub.id}
									>
										{sub.title}
									</MenuItem>
								))}
							</TextField>

							<TextField
								label="Page Number"
								type="number"
								fullWidth
								value={formData.page_start}
								onChange={(e) => {
									const p = Number(e.target.value);
									setFormData({ ...formData, page_start: p, page_end: p });
								}}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<TextField
								label="Chapter ID"
								fullWidth
								value={formData.chapter_id}
								onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
								placeholder="e.g. algebra"
							/>

							<TextField
								label="Chapter Title"
								fullWidth
								value={formData.chapter_title}
								onChange={(e) => setFormData({ ...formData, chapter_title: e.target.value })}
								placeholder="e.g. বীজগণিতীয় রাশি"
							/>
						</div>

						<TextField
							label="Textbook Content (Bangla / English)"
							fullWidth
							required
							multiline
							rows={8}
							value={formData.text}
							onChange={(e) => setFormData({ ...formData, text: e.target.value })}
							placeholder="Paste the lesson, textbook paragraph, formulas, or chapter text here..."
						/>
					</DialogContent>
					<DialogActions className="p-4">
						<Button
							onClick={handleCloseDialog}
							color="inherit"
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="contained"
							color="primary"
							disabled={submitting}
						>
							{submitting ? 'Indexing Vectors...' : 'Submit & Ingest'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</div>
	);
}
