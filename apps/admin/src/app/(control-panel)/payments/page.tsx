'use client';

import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
	adminAdminService,
	PaymentReconciliation,
	PendingPayment
} from '@/features/admin/services/admin-admin.service';

export default function PaymentsPage() {
	const [payments, setPayments] = useState<PendingPayment[]>([]);
	const [reconciliation, setReconciliation] = useState<PaymentReconciliation | null>(null);
	const [activeTab, setActiveTab] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [processing, setProcessing] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [pendingRes, reconRes] = await Promise.all([
				adminAdminService.listPendingPayments(),
				adminAdminService.getPaymentReconciliation()
			]);
			setPayments(pendingRes.transactions);
			setReconciliation(reconRes);
			setError(null);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load payments data');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const processPayment = async (payment: PendingPayment, action: 'approve' | 'reject') => {
		const note = window.prompt(action === 'approve' ? 'Verification note (optional):' : 'Rejection reason:');

		if (action === 'reject' && !note?.trim()) return;

		if (!window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} transaction ${payment.transactionId}?`))
			return;

		setProcessing(payment.transactionId);
		setError(null);
		setSuccessMessage(null);
		try {
			if (action === 'approve') await adminAdminService.approvePayment(payment.transactionId, note || undefined);
			else await adminAdminService.rejectPayment(payment.transactionId, note!.trim());

			setSuccessMessage(
				`Transaction ${payment.transactionId} successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
			);
			await loadData();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Payment action failed');
		} finally {
			setProcessing(null);
		}
	};

	const refundPayment = async (transactionId: string) => {
		const reason = window.prompt('Enter reason for issuing refund:');

		if (!reason?.trim()) return;

		if (!window.confirm(`Issue refund for transaction ${transactionId}? This will cancel subscription access.`))
			return;

		setProcessing(transactionId);
		setError(null);
		setSuccessMessage(null);
		try {
			await adminAdminService.refundPayment(transactionId, reason.trim());
			setSuccessMessage(`Transaction ${transactionId} refunded successfully.`);
			await loadData();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Refund failed');
		} finally {
			setProcessing(null);
		}
	};

	return (
		<div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
			<div className="mb-6">
				<Typography
					variant="h4"
					className="font-extrabold tracking-tight"
				>
					Payments & Reconciliation
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
				>
					Verify pending MFS transactions, review settlements, and execute refunds.
				</Typography>
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

			{reconciliation && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
						<Typography
							variant="caption"
							color="text.secondary"
							className="font-semibold uppercase tracking-wider"
						>
							Settled Revenue
						</Typography>
						<Typography
							variant="h5"
							className="font-bold mt-1 text-green-600"
						>
							৳{reconciliation.summary.settledAmountBdt.toLocaleString()}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
						>
							{reconciliation.summary.settledCount} transactions settled
						</Typography>
					</Paper>

					<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
						<Typography
							variant="caption"
							color="text.secondary"
							className="font-semibold uppercase tracking-wider"
						>
							Pending Volume
						</Typography>
						<Typography
							variant="h5"
							className="font-bold mt-1 text-amber-600"
						>
							৳{reconciliation.summary.pendingAmountBdt.toLocaleString()}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
						>
							{reconciliation.summary.pendingCount} pending manual approvals
						</Typography>
					</Paper>

					<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
						<Typography
							variant="caption"
							color="text.secondary"
							className="font-semibold uppercase tracking-wider"
						>
							Refunds Issued
						</Typography>
						<Typography
							variant="h5"
							className="font-bold mt-1 text-red-600"
						>
							৳{reconciliation.summary.refundedAmountBdt.toLocaleString()}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
						>
							{reconciliation.summary.refundedCount} refunds executed
						</Typography>
					</Paper>

					<Paper className="p-4 rounded-2xl border border-divider shadow-sm">
						<Typography
							variant="caption"
							color="text.secondary"
							className="font-semibold uppercase tracking-wider"
						>
							Total Volume
						</Typography>
						<Typography
							variant="h5"
							className="font-bold mt-1"
						>
							{reconciliation.summary.totalTransactions}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
						>
							{reconciliation.summary.failedCount} failed attempts
						</Typography>
					</Paper>
				</div>
			)}

			<Tabs
				value={activeTab}
				onChange={(_, val) => setActiveTab(val)}
				className="mb-4 border-b border-divider"
			>
				<Tab label={`Pending Approvals (${payments.length})`} />
				<Tab label="Recent Settlements" />
				<Tab label="Refund History" />
			</Tabs>

			{loading ? (
				<div className="flex justify-center py-16">
					<CircularProgress />
				</div>
			) : activeTab === 0 ? (
				<Paper className="rounded-2xl border border-divider shadow-sm overflow-hidden">
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Transaction</TableCell>
									<TableCell>User</TableCell>
									<TableCell>Amount</TableCell>
									<TableCell>Payment details</TableCell>
									<TableCell>Created</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{payments.map((payment) => (
									<TableRow
										key={payment._id}
										hover
									>
										<TableCell>
											<Typography className="font-semibold">{payment.transactionId}</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{payment._id}
											</Typography>
										</TableCell>
										<TableCell>{payment.userId}</TableCell>
										<TableCell>
											৳{payment.amountBdt.toLocaleString()} {payment.currency}
										</TableCell>
										<TableCell>
											{payment.paymentMethod}
											<br />
											{payment.senderNumber || payment.manualTrxId || '—'}
										</TableCell>
										<TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
										<TableCell align="right">
											<div className="flex justify-end gap-1">
												<Button
													size="small"
													color="success"
													disabled={processing === payment.transactionId}
													onClick={() => processPayment(payment, 'approve')}
												>
													Approve
												</Button>
												<Button
													size="small"
													color="error"
													disabled={processing === payment.transactionId}
													onClick={() => processPayment(payment, 'reject')}
												>
													Reject
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					{payments.length === 0 && (
						<Typography
							color="text.secondary"
							className="p-8 text-center"
						>
							No pending manual payments.
						</Typography>
					)}
				</Paper>
			) : activeTab === 1 ? (
				<Paper className="rounded-2xl border border-divider shadow-sm overflow-hidden">
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Transaction ID</TableCell>
									<TableCell>User</TableCell>
									<TableCell>Amount</TableCell>
									<TableCell>Method</TableCell>
									<TableCell>Date</TableCell>
									<TableCell align="right">Action</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{reconciliation?.recentSettlements.map((tx) => (
									<TableRow
										key={tx._id}
										hover
									>
										<TableCell className="font-semibold">{tx.transactionId}</TableCell>
										<TableCell>{tx.userId}</TableCell>
										<TableCell>
											৳{tx.amountBdt.toLocaleString()} {tx.currency}
										</TableCell>
										<TableCell className="capitalize">{tx.paymentMethod}</TableCell>
										<TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
										<TableCell align="right">
											<Button
												size="small"
												color="error"
												variant="outlined"
												disabled={processing === tx.transactionId}
												onClick={() => refundPayment(tx.transactionId)}
											>
												{processing === tx.transactionId ? 'Refunding…' : 'Refund'}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					{(!reconciliation?.recentSettlements || reconciliation.recentSettlements.length === 0) && (
						<Typography
							color="text.secondary"
							className="p-8 text-center"
						>
							No recent settled transactions found.
						</Typography>
					)}
				</Paper>
			) : (
				<Paper className="rounded-2xl border border-divider shadow-sm overflow-hidden">
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Transaction ID</TableCell>
									<TableCell>User</TableCell>
									<TableCell>Refunded Amount</TableCell>
									<TableCell>Refund Reason</TableCell>
									<TableCell>Refunded Date</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{reconciliation?.recentRefunds.map((rf) => (
									<TableRow
										key={rf._id}
										hover
									>
										<TableCell className="font-semibold">{rf.transactionId}</TableCell>
										<TableCell>{rf.userId}</TableCell>
										<TableCell className="text-red-600 font-semibold">
											৳{rf.amountBdt.toLocaleString()}
										</TableCell>
										<TableCell>{rf.refundReason || '—'}</TableCell>
										<TableCell>
											{rf.refundedAt ? new Date(rf.refundedAt).toLocaleString() : '—'}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					{(!reconciliation?.recentRefunds || reconciliation.recentRefunds.length === 0) && (
						<Typography
							color="text.secondary"
							className="p-8 text-center"
						>
							No refunds recorded yet.
						</Typography>
					)}
				</Paper>
			)}
		</div>
	);
}
