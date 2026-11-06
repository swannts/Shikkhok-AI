import { apiClient } from '@/lib/api/api-client';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending_verification';

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
	actorUserId: { _id?: string; name?: string; email?: string; role?: string } | string;
	action: string;
	resourceType: string;
	resourceId: string;
	reason?: string;
	before?: Record<string, unknown> | null;
	after?: Record<string, unknown> | null;
	createdAt: string;
}

export interface PlatformHealth {
	status: 'healthy' | 'degraded' | 'unhealthy';
	timestamp: string;
	services: {
		mongodb: { status: 'up' | 'down'; latencyMs: number };
		redis: { status: 'up' | 'down'; latencyMs: number };
		aiService: { status: 'up' | 'down' | 'disabled'; healthy: boolean };
		vectorStore: { status: 'up' | 'down' | 'unknown'; totalVectors?: number };
		queues: {
			status: 'up' | 'down';
			totalWaiting: number;
			totalFailed: number;
		};
	};
}

export interface QueueMetric {
	name: string;
	counts: {
		waiting: number;
		active: number;
		completed: number;
		failed: number;
		delayed: number;
		paused: number;
	};
	isPaused: boolean;
}

interface QueueCounts {
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
	paused: number;
	status?: string;
	error?: string;
}

export interface FailedJob {
	id?: string;
	name: string;
	failedReason?: string;
	attemptsMade: number;
	timestamp: number;
	data: unknown;
}

export interface FailedQueueJobsResponse {
	queue: string;
	failedCount: number;
	jobs: FailedJob[];
}

export interface TextbookIndexingItem {
	bookId: string;
	title: string;
	titleBn: string;
	classLevel: number;
	medium: 'bangla' | 'english';
	curriculumYear: number;
	curriculumVersion?: string;
	edition?: string | null;
	subject?: string | null;
	subjectBn?: string | null;
	indexingStatus: string;
	indexedChunkCount: number;
	failedChunkCount: number;
	indexingStartedAt?: string | null;
	lastIndexedAt?: string | null;
	lastError?: string | null;
}

export interface CurriculumSubjectOption {
	_id: string;
	name: string;
	slug: string;
	classLevel: number;
	medium: 'bangla' | 'english';
	curriculumYear: number;
}

export interface PaymentReconciliation {
	summary: {
		totalTransactions: number;
		settledCount: number;
		settledAmountBdt: number;
		pendingCount: number;
		pendingAmountBdt: number;
		refundedCount: number;
		refundedAmountBdt: number;
		failedCount: number;
	};
	recentSettlements: {
		_id: string;
		transactionId: string;
		userId: string;
		amountBdt: number;
		currency: string;
		paymentMethod: string;
		status: string;
		createdAt: string;
	}[];
	recentRefunds: {
		_id: string;
		transactionId: string;
		userId: string;
		amountBdt: number;
		refundedAt?: string;
		refundReason?: string;
	}[];
	generatedAt: string;
}

export const adminAdminService = {
	getMetrics(): Promise<AdminMetrics> {
		return apiClient.get('/admin/metrics/overview');
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

	updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<AdminUser> {
		return apiClient.put(`/admin/users/${userId}/status`, { status, reason });
	},

	listPendingPayments(
		page = 1,
		limit = 20
	): Promise<{ transactions: PendingPayment[]; page: number; limit: number }> {
		return apiClient.get(`/admin/payments/pending?page=${page}&limit=${limit}`);
	},

	approvePayment(transactionId: string, verificationNote?: string) {
		return apiClient.post(`/admin/payments/${transactionId}/approve`, {
			verificationNote
		});
	},

	rejectPayment(transactionId: string, rejectionReason: string) {
		return apiClient.post(`/admin/payments/${transactionId}/reject`, {
			rejectionReason
		});
	},

	listAuditLogs(params: { page?: number; limit?: number; action?: string; resourceType?: string }): Promise<{
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

	revokeUserSessions(userId: string): Promise<{ userId: string; revokedCount: number; message: string }> {
		return apiClient.post(`/admin/users/${userId}/revoke-sessions`);
	},

	refundPayment(transactionId: string, refundReason: string): Promise<unknown> {
		return apiClient.post(`/admin/payments/${transactionId}/refund`, {
			refundReason
		});
	},

	getPaymentReconciliation(): Promise<PaymentReconciliation> {
		return apiClient.get('/admin/payments/reconciliation');
	},

	getPlatformHealth(): Promise<PlatformHealth> {
		return apiClient.get('/admin/operations/health');
	},

	async getQueueMetrics(): Promise<{
		timestamp: string;
		queues: QueueMetric[];
	}> {
		const response = await apiClient.get<{
			timestamp: string;
			queues: Record<string, QueueCounts>;
		}>('/admin/operations/queues');
		return {
			timestamp: response.timestamp,
			queues: Object.entries(response.queues).map(([name, counts]) => ({
				name,
				counts,
				isPaused: counts.paused > 0
			}))
		};
	},

	async getFailedQueueJobs(queueName: string, limit = 20): Promise<FailedQueueJobsResponse> {
		const jobs = await apiClient.get<FailedJob[]>(
			`/admin/operations/queues/${encodeURIComponent(queueName)}/failed?limit=${limit}`
		);
		return { queue: queueName, failedCount: jobs.length, jobs };
	},

	async retryFailedQueueJobs(
		queueName: string,
		limit = 50
	): Promise<{
		queue: string;
		retriedCount: number;
		totalFound: number;
		message: string;
	}> {
		const response = await apiClient.post<{
			queue: string;
			retriedCount: number;
			totalFound: number;
		}>(`/admin/operations/queues/${encodeURIComponent(queueName)}/retry`, {
			limit
		});
		return {
			...response,
			message: `${response.retriedCount} of ${response.totalFound} failed jobs queued for retry.`
		};
	},

	listTextbookIndexing(
		page = 1,
		limit = 50
	): Promise<{
		items: TextbookIndexingItem[];
		pageInfo: {
			page: number;
			limit: number;
			total: number;
			hasNextPage: boolean;
		};
	}> {
		return apiClient.get(`/admin/textbooks/indexing-status?page=${page}&limit=${limit}`);
	},

	getCurriculumSubjects(params: {
		classLevel: number;
		medium: 'bangla' | 'english';
		curriculumYear: number;
	}): Promise<CurriculumSubjectOption[]> {
		const query = new URLSearchParams({
			classLevel: String(params.classLevel),
			medium: params.medium,
			curriculumYear: String(params.curriculumYear)
		});
		return apiClient.get(`/curriculum/subjects?${query.toString()}`);
	},

	uploadTextbook(formData: FormData): Promise<{ bookId: string; status: string }> {
		return apiClient.post('/admin/textbooks/upload', formData);
	},

	reindexTextbook(bookId: string): Promise<{ bookId: string; status: string }> {
		return apiClient.post(`/admin/textbooks/${encodeURIComponent(bookId)}/reindex`);
	}
};
