'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
	adminAdminService,
	CurriculumSubjectOption,
	TextbookIndexingItem
} from '@/features/admin/services/admin-admin.service';

const MAX_PDF_BYTES = 50 * 1024 * 1024;

export default function CurriculumBooksPage() {
	const [books, setBooks] = useState<TextbookIndexingItem[]>([]);
	const [page, setPage] = useState(1);
	const [pageInfo, setPageInfo] = useState({
		page: 1,
		limit: 50,
		total: 0,
		hasNextPage: false
	});
	const [subjects, setSubjects] = useState<CurriculumSubjectOption[]>([]);
	const [file, setFile] = useState<File | null>(null);
	const [classLevel, setClassLevel] = useState(3);
	const [medium, setMedium] = useState<'bangla' | 'english'>('bangla');
	const [curriculumYear, setCurriculumYear] = useState('');
	const [subjectId, setSubjectId] = useState('');
	const [title, setTitle] = useState('');
	const [titleBn, setTitleBn] = useState('');
	const [edition, setEdition] = useState('');
	const [curriculumVersion, setCurriculumVersion] = useState('');
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [reindexingId, setReindexingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const loadBooks = useCallback(async () => {
		try {
			const response = await adminAdminService.listTextbookIndexing(page, 50);
			setBooks(response.items);
			setPageInfo(response.pageInfo);
			setError(null);
		} catch (cause: unknown) {
			setError(cause instanceof Error ? cause.message : 'Could not load textbook indexing status.');
		} finally {
			setLoading(false);
		}
	}, [page]);

	useEffect(() => {
		void loadBooks();
	}, [loadBooks]);

	useEffect(() => {
		const isProcessing = books.some((book) => ['queued', 'processing'].includes(book.indexingStatus));

		if (!isProcessing) return;

		const timer = window.setInterval(() => void loadBooks(), 8000);
		return () => window.clearInterval(timer);
	}, [books, loadBooks]);

	useEffect(() => {
		const year = Number(curriculumYear);

		if (!/^\d{4}$/.test(curriculumYear) || year < 2020 || year > 2100) {
			setSubjects([]);
			setSubjectId('');
			return;
		}

		let active = true;
		adminAdminService
			.getCurriculumSubjects({ classLevel, medium, curriculumYear: year })
			.then((result) => {
				if (!active) return;

				setSubjects(result);
				setSubjectId((current) => (result.some((subject) => subject._id === current) ? current : ''));
			})
			.catch((cause: unknown) => {
				if (active) setError(cause instanceof Error ? cause.message : 'Could not load matching subjects.');
			});
		return () => {
			active = false;
		};
	}, [classLevel, medium, curriculumYear]);

	const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files?.[0] ?? null;

		if (selected && (selected.type !== 'application/pdf' || selected.size > MAX_PDF_BYTES)) {
			setFile(null);
			setError('Choose a PDF file smaller than 50 MB.');
			return;
		}

		setFile(selected);
		setError(null);
	};

	const upload = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const year = Number(curriculumYear);

		if (
			!file ||
			!subjectId ||
			!title.trim() ||
			!titleBn.trim() ||
			!/^\d{4}$/.test(curriculumYear) ||
			year < 2020 ||
			year > 2100
		) {
			setError(
				'Select a PDF, enter a valid curriculum year (2020–2100), choose its subject, and enter both book titles.'
			);
			return;
		}

		setUploading(true);
		setError(null);
		setNotice(null);
		try {
			const form = new FormData();
			form.append('file', file);
			form.append('title', title.trim());
			form.append('titleBn', titleBn.trim());
			form.append('subjectId', subjectId);
			form.append('classLevel', String(classLevel));
			form.append('medium', medium);
			form.append('curriculumYear', String(year));

			if (edition.trim()) form.append('edition', edition.trim());

			if (curriculumVersion.trim()) form.append('curriculumVersion', curriculumVersion.trim());

			const result = await adminAdminService.uploadTextbook(form);
			setNotice(`Book upload queued for indexing (${result.bookId}).`);
			setFile(null);

			if (page !== 1) {
				setPage(1);
				return;
			}

			await loadBooks();
		} catch (cause: unknown) {
			setError(cause instanceof Error ? cause.message : 'Textbook upload failed.');
		} finally {
			setUploading(false);
		}
	};

	const reindex = async (bookId: string) => {
		setReindexingId(bookId);
		setError(null);
		try {
			await adminAdminService.reindexTextbook(bookId);
			setNotice('Reindexing queued. Status will refresh automatically.');
			await loadBooks();
		} catch (cause: unknown) {
			setError(cause instanceof Error ? cause.message : 'Could not queue reindexing.');
		} finally {
			setReindexingId(null);
		}
	};

	const statusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
		if (status === 'indexed') return 'success';

		if (status === 'failed' || status === 'partially_failed') return 'error';

		if (status === 'queued' || status === 'processing') return 'warning';

		return 'default';
	};

	return (
		<div className="flex flex-col flex-auto min-w-0 p-6 md:p-10 gap-6">
			<div>
				<Typography
					variant="h4"
					className="font-extrabold tracking-tight"
				>
					Books & Indexing
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
				>
					Upload a source textbook PDF, assign its curriculum scope, and monitor chapter extraction and AI
					indexing.
				</Typography>
			</div>
			{error && (
				<Alert
					severity="error"
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}
			{notice && (
				<Alert
					severity="success"
					onClose={() => setNotice(null)}
				>
					{notice}
				</Alert>
			)}

			<Paper
				component="form"
				onSubmit={upload}
				className="p-5 rounded-2xl border border-divider shadow-sm"
			>
				<Typography
					variant="h6"
					className="font-bold mb-4"
				>
					Upload textbook PDF
				</Typography>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<TextField
						select
						label="Class"
						value={classLevel}
						onChange={(event) => setClassLevel(Number(event.target.value))}
					>
						{Array.from({ length: 12 }, (_, index) => index + 1).map((level) => (
							<MenuItem
								key={level}
								value={level}
							>
								Class {level}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						label="Medium"
						value={medium}
						onChange={(event) => setMedium(event.target.value as 'bangla' | 'english')}
					>
						<MenuItem value="bangla">Bangla</MenuItem>
						<MenuItem value="english">English</MenuItem>
					</TextField>
					<TextField
						label="Curriculum year"
						type="number"
						value={curriculumYear}
						inputProps={{ min: 2020, max: 2100, step: 1 }}
						onChange={(event) => setCurriculumYear(event.target.value)}
						required
					/>
					<TextField
						select
						label="Subject"
						value={subjectId}
						onChange={(event) => setSubjectId(event.target.value)}
						disabled={!subjects.length}
					>
						{subjects.map((subject) => (
							<MenuItem
								key={subject._id}
								value={subject._id}
							>
								{subject.name}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label="Book title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						required
					/>
					<TextField
						label="Book title (Bangla)"
						value={titleBn}
						onChange={(event) => setTitleBn(event.target.value)}
						required
					/>
					<TextField
						label="Edition (optional)"
						value={edition}
						onChange={(event) => setEdition(event.target.value)}
					/>
					<TextField
						label="Curriculum version (optional; uses server active version)"
						value={curriculumVersion}
						onChange={(event) => setCurriculumVersion(event.target.value)}
					/>
					<Button
						component="label"
						variant="outlined"
						className="min-h-14"
					>
						{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : 'Choose PDF (max 50 MB)'}
						<input
							hidden
							type="file"
							accept="application/pdf,.pdf"
							onChange={selectFile}
						/>
					</Button>
				</div>
				<div className="flex justify-end mt-4">
					<Button
						type="submit"
						variant="contained"
						disabled={uploading || !file || !subjectId || !curriculumYear}
					>
						{uploading ? (
							<CircularProgress
								size={20}
								color="inherit"
							/>
						) : (
							'Upload and index'
						)}
					</Button>
				</div>
			</Paper>

			<Paper className="rounded-2xl border border-divider shadow-sm overflow-hidden">
				<div className="p-5 border-b border-divider">
					<Typography
						variant="h6"
						className="font-bold"
					>
						Indexing status
					</Typography>
					<Typography
						variant="body2"
						color="text.secondary"
					>
						{pageInfo.total} registered book{pageInfo.total === 1 ? '' : 's'}
					</Typography>
				</div>
				{loading ? (
					<div className="flex justify-center p-8">
						<CircularProgress />
					</div>
				) : (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Book</TableCell>
									<TableCell>Scope</TableCell>
									<TableCell>Status</TableCell>
									<TableCell align="right">Indexed chunks</TableCell>
									<TableCell align="right">Failed chunks</TableCell>
									<TableCell>Last error</TableCell>
									<TableCell align="right">Action</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{books.map((book) => (
									<TableRow
										key={book.bookId}
										hover
									>
										<TableCell>
											<Typography fontWeight={700}>{book.titleBn || book.title}</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{book.title}
											</Typography>
										</TableCell>
										<TableCell>
											Class {book.classLevel} · {book.subjectBn || book.subject || '—'} ·{' '}
											{book.medium} · {book.curriculumYear}
										</TableCell>
										<TableCell>
											<Chip
												size="small"
												color={statusColor(book.indexingStatus)}
												label={book.indexingStatus}
											/>
										</TableCell>
										<TableCell align="right">{book.indexedChunkCount}</TableCell>
										<TableCell align="right">{book.failedChunkCount}</TableCell>
										<TableCell
											className="max-w-xs truncate"
											title={book.lastError || ''}
										>
											{book.lastError || '—'}
										</TableCell>
										<TableCell align="right">
											<Button
												size="small"
												disabled={
													reindexingId === book.bookId ||
													['queued', 'processing'].includes(book.indexingStatus)
												}
												onClick={() => void reindex(book.bookId)}
											>
												{reindexingId === book.bookId ? 'Queueing…' : 'Reindex'}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
				{!loading && books.length === 0 && (
					<Typography
						color="text.secondary"
						className="p-8 text-center"
					>
						No textbooks registered yet.
					</Typography>
				)}
				{!loading && pageInfo.total > pageInfo.limit && (
					<div className="flex items-center justify-end gap-2 p-4 border-t border-divider">
						<Typography
							variant="body2"
							color="text.secondary"
						>
							Page {pageInfo.page}
						</Typography>
						<Button
							size="small"
							disabled={pageInfo.page <= 1}
							onClick={() => setPage((current) => Math.max(1, current - 1))}
						>
							Previous
						</Button>
						<Button
							size="small"
							disabled={!pageInfo.hasNextPage}
							onClick={() => setPage((current) => current + 1)}
						>
							Next
						</Button>
					</div>
				)}
			</Paper>
		</div>
	);
}
