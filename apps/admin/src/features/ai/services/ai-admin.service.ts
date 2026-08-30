import { apiClient } from '@/lib/api/api-client';

export interface AiHealthResponse {
	enabled: boolean;
	healthy: boolean;
	status: 'healthy' | 'unhealthy' | 'disabled';
	timestamp: string;
}

export interface IngestionStatsResponse {
	total_chunks: number;
	total_documents: number;
	books: {
		book_id: string;
		chunk_count: number;
	}[];
}

export interface IngestTextbookPayload {
	text: string;
	source_book: string;
	book_id: string;
	class_level?: number;
	subject_id?: string;
	subject_title?: string;
	chapter_id?: string;
	chapter_title?: string;
	page_start?: number;
	page_end?: number;
	chunk_size?: number;
	chunk_overlap?: number;
}

export interface IngestChunkResponse {
	indexed_count: number;
	book_id: string;
	status: string;
}

export interface DeleteBookResponse {
	deleted_count: number;
	book_id: string;
	status: string;
}

export const aiAdminService = {
	async getHealth(): Promise<AiHealthResponse> {
		return apiClient.get<AiHealthResponse>('/api/v1/admin/ai/health');
	},

	async getStats(): Promise<IngestionStatsResponse> {
		return apiClient.get<IngestionStatsResponse>('/api/v1/admin/ai/stats');
	},

	async ingestChunk(payload: IngestTextbookPayload): Promise<IngestChunkResponse> {
		return apiClient.post<IngestChunkResponse>('/api/v1/admin/ai/ingest', payload);
	},

	async deleteBook(bookId: string): Promise<DeleteBookResponse> {
		return apiClient.delete<DeleteBookResponse>(`/api/v1/admin/ai/books/${encodeURIComponent(bookId)}`);
	}
};
