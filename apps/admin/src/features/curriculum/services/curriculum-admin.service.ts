import { apiClient } from '@/lib/api/api-client';

export interface CurriculumCompletenessRow {
	subjectId: string;
	subject: string;
	classLevel: number;
	medium: string;
	curriculumYear: number;
	chapters: number;
	lessons: number;
	publishedLessons: number;
	structuredLessons: number;
	completenessPercent: number;
	missingContent: string[];
}

export const curriculumAdminService = {
	async getCompleteness(): Promise<{ rows: CurriculumCompletenessRow[]; generatedAt: string }> {
		return apiClient.get('/api/v1/admin/curriculum/completeness');
	},
	async transitionLesson(lessonId: string, status: string, reviewComments?: string) {
		return apiClient.put(`/api/v1/admin/curriculum/lessons/${lessonId}/workflow`, {
			status,
			reviewComments
		});
	}
};
