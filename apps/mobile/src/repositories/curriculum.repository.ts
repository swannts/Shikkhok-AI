import { offlineStorageManager } from './offlineStorage.repository';

export interface LessonContent {
  id: string;
  title: string;
  subjectId: string;
  blocks: any[];
}

export class CurriculumRepository {
  /**
   * Fetches lesson content using Repository Pattern:
   * 1. Check local offline cache first for instant UI render / offline support.
   * 2. If online, fetch fresh lesson data via API client.
   * 3. Update local offline cache in background.
   */
  public async getLessonById(lessonId: string, apiFetcher: (id: string) => Promise<LessonContent>): Promise<LessonContent> {
    const cacheKey = `lesson:${lessonId}`;

    // 1. Try local offline cache
    const cachedLesson = await offlineStorageManager.getCached<LessonContent>(cacheKey);

    try {
      // 2. Fetch fresh online copy from backend API
      const freshLesson = await apiFetcher(lessonId);
      // 3. Cache for offline usage
      await offlineStorageManager.saveCached(cacheKey, freshLesson);
      return freshLesson;
    } catch (err) {
      // If offline / network failure, return cached copy if available
      if (cachedLesson) {
        console.log(`[CurriculumRepository] Network offline. Serving cached lesson ${lessonId}`);
        return cachedLesson;
      }
      throw err;
    }
  }

  /**
   * Queue student lesson progress updates when offline
   */
  public async updateLessonProgress(studentId: string, lessonId: string, progress: number, isOnline: boolean, syncHandler?: () => Promise<void>) {
    if (isOnline && syncHandler) {
      return await syncHandler();
    }

    // Queue for background sync when connection is restored
    await offlineStorageManager.enqueueSync('UPDATE_LESSON_PROGRESS', {
      studentId,
      lessonId,
      progress,
    });

    console.log(`[CurriculumRepository] Progress queued offline for lesson ${lessonId}`);
  }
}

export const curriculumRepository = new CurriculumRepository();
