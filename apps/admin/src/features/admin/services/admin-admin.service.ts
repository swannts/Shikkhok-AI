import { apiClient } from "@/lib/api/api-client";

export type UserRole = "student" | "parent" | "teacher" | "admin";
export type UserStatus = "active" | "suspended" | "pending_verification";

export interface AdminMetrics {
  users: {
    total: number;
    activeLast24h: number;
    byRole: Record<string, number>;
  };
  academics: { totalExamsTaken: number; totalHomeworkSubmissions: number };
  commercial: { activeSubscribers: number; totalRevenueBdt: number };
  generatedAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PendingPayment {
  _id: string;
  transactionId: string;
  userId: string;
  amountBdt: number;
  currency: string;
  paymentMethod: string;
  senderNumber?: string;
  manualTrxId?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorUserId:
    | { _id?: string; name?: string; email?: string; role?: string }
    | string;
  action: string;
  resourceType: string;
  resourceId: string;
  reason?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt: string;
}

export const adminAdminService = {
  getMetrics(): Promise<AdminMetrics> {
    return apiClient.get("/admin/metrics/overview");
  },

  listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<UserListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return apiClient.get(`/admin/users?${query.toString()}`);
  },

  updateUserStatus(
    userId: string,
    status: UserStatus,
    reason?: string,
  ): Promise<AdminUser> {
    return apiClient.put(`/admin/users/${userId}/status`, { status, reason });
  },

  listPendingPayments(
    page = 1,
    limit = 20,
  ): Promise<{ transactions: PendingPayment[]; page: number; limit: number }> {
    return apiClient.get(`/admin/payments/pending?page=${page}&limit=${limit}`);
  },

  approvePayment(transactionId: string, verificationNote?: string) {
    return apiClient.post(`/admin/payments/${transactionId}/approve`, {
      verificationNote,
    });
  },

  rejectPayment(transactionId: string, rejectionReason: string) {
    return apiClient.post(`/admin/payments/${transactionId}/reject`, {
      rejectionReason,
    });
  },

  listAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
  }): Promise<{
    auditLogs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return apiClient.get(`/admin/audit-logs?${query.toString()}`);
  },
};
