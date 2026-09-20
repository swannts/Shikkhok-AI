"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {
  adminAdminService,
  AuditLog,
} from "@/features/admin/services/admin-admin.service";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [applied, setApplied] = useState({ action: "", resourceType: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAdminService.listAuditLogs({
        page: page + 1,
        limit: 25,
        ...applied,
      });
      setLogs(result.auditLogs);
      setTotal(result.pagination.total);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
      <div className="mb-6">
        <Typography variant="h4" className="font-extrabold tracking-tight">
          Audit Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review administrator actions recorded by the backend.
        </Typography>
      </div>
      {error && (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      )}
      <Paper className="p-4 mb-4 rounded-2xl border border-divider shadow-sm">
        <div className="flex flex-wrap gap-3">
          <TextField
            size="small"
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <TextField
            size="small"
            label="Resource type"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => {
              setPage(0);
              setApplied({
                action: action.trim(),
                resourceType: resourceType.trim(),
              });
            }}
          >
            Filter
          </Button>
        </div>
      </Paper>
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
                  <TableCell>Time</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Changes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const actor =
                    typeof log.actorUserId === "string"
                      ? log.actorUserId
                      : log.actorUserId?.name ||
                        log.actorUserId?.email ||
                        "Unknown";
                  return (
                    <TableRow key={log._id} hover>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{actor}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        {log.resourceType}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {log.resourceId}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.reason || "—"}</TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          component="pre"
                          className="max-w-xs whitespace-pre-wrap"
                        >
                          {JSON.stringify(
                            { before: log.before, after: log.after },
                            null,
                            2,
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={25}
          rowsPerPageOptions={[25]}
        />
      </Paper>
    </div>
  );
}
