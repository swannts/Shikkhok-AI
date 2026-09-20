"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  adminAdminService,
  AdminUser,
  UserRole,
  UserStatus,
  UserListResponse,
} from "@/features/admin/services/admin-admin.service";

export default function UsersPage() {
  const [result, setResult] = useState<UserListResponse | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setResult(
        await adminAdminService.listUsers({
          page: page + 1,
          limit: 20,
          search: appliedSearch,
          role: role || undefined,
          status: status || undefined,
        }),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, role, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const applySearch = () => {
    setPage(0);
    setAppliedSearch(search.trim());
  };

  const updateStatus = async (user: AdminUser) => {
    const nextStatus: UserStatus =
      user.status === "active" ? "suspended" : "active";
    if (!window.confirm(`Set ${user.name}'s status to ${nextStatus}?`)) return;
    setUpdating(user._id);
    try {
      await adminAdminService.updateUserStatus(
        user._id,
        nextStatus,
        "Updated from admin user management",
      );
      await loadUsers();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update user status",
      );
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-col flex-auto min-w-0 p-6 md:p-10">
      <div className="mb-6">
        <Typography variant="h4" className="font-extrabold tracking-tight">
          Users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Search users and manage account status.
        </Typography>
      </div>
      {error && (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      )}
      <Paper className="p-4 mb-4 rounded-2xl border border-divider shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <TextField
            size="small"
            label="Search name, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
          <Select
            size="small"
            displayEmpty
            value={role}
            onChange={(e) => {
              setPage(0);
              setRole(e.target.value as UserRole | "");
            }}
          >
            <MenuItem value="">All roles</MenuItem>
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="parent">Parent</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <Select
            size="small"
            displayEmpty
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value as UserStatus | "");
            }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="pending_verification">
              Pending verification
            </MenuItem>
          </Select>
          <Button variant="contained" onClick={applySearch}>
            Search
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
                  <TableCell>Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Typography className="font-semibold">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user._id}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email || user.phone || "—"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color={user.status === "active" ? "warning" : "success"}
                        disabled={
                          updating === user._id || user.role === "admin"
                        }
                        onClick={() => updateStatus(user)}
                      >
                        {updating === user._id
                          ? "Saving…"
                          : user.status === "active"
                            ? "Suspend"
                            : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {result && (
          <TablePagination
            component="div"
            count={result.pagination.total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
          />
        )}
      </Paper>
    </div>
  );
}
