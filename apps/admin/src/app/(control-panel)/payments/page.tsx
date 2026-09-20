"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  adminAdminService,
  PendingPayment,
} from "@/features/admin/services/admin-admin.service";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      setPayments((await adminAdminService.listPendingPayments()).transactions);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load pending payments",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const processPayment = async (
    payment: PendingPayment,
    action: "approve" | "reject",
  ) => {
    const note = window.prompt(
      action === "approve"
        ? "Verification note (optional):"
        : "Rejection reason:",
    );
    if (action === "reject" && !note?.trim()) return;
    if (
      !window.confirm(
        `${action === "approve" ? "Approve" : "Reject"} transaction ${payment.transactionId}?`,
      )
    )
      return;
    setProcessing(payment.transactionId);
    try {
      if (action === "approve")
        await adminAdminService.approvePayment(
          payment.transactionId,
          note || undefined,
        );
      else
        await adminAdminService.rejectPayment(
          payment.transactionId,
          note!.trim(),
        );
      await loadPayments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment action failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
      <div className="mb-6">
        <Typography variant="h4" className="font-extrabold tracking-tight">
          Manual Payments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verify pending MFS transactions before activating subscriptions.
        </Typography>
      </div>
      {error && (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      )}
      <Paper className="rounded-2xl border border-divider shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <CircularProgress />
          </div>
        ) : (
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
                  <TableRow key={payment._id} hover>
                    <TableCell>
                      <Typography className="font-semibold">
                        {payment.transactionId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
                      {payment.senderNumber || payment.manualTrxId || "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="small"
                          color="success"
                          disabled={processing === payment.transactionId}
                          onClick={() => processPayment(payment, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={processing === payment.transactionId}
                          onClick={() => processPayment(payment, "reject")}
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
        )}
        {!loading && payments.length === 0 && (
          <Typography color="text.secondary" className="p-8 text-center">
            No pending manual payments.
          </Typography>
        )}
      </Paper>
    </div>
  );
}
