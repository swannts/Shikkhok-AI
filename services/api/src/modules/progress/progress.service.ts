import { progressRepository } from './progress.repository';

export class ProgressService {
  async getSummary(studentId: string) {
    return progressRepository.getStudentProgressSummary(studentId);
  }

  async markLessonComplete(studentId: string, lessonId: string, progressValue: number) {
    return progressRepository.markLessonComplete(studentId, lessonId, progressValue);
  }

  async getLessonProgress(studentId: string, lessonId: string) {
    return progressRepository.getLessonProgress(studentId, lessonId);
  }
}

export const progressService = new ProgressService();
