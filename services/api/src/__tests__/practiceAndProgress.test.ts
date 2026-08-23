import { practiceService } from '../modules/practice/practice.service';
import { progressRepository } from '../modules/progress/progress.repository';

describe('Critical Workflow Integration: Practice Session & Lesson Progress', () => {
  const studentId = 'test-student-101';
  const lessonId = 'lesson-algebra-eq-1';

  it('records question attempt, persists backend topic mastery, and returns immediate feedback', async () => {
    const result = await practiceService.evaluateAndPersistAnswer({
      studentId,
      questionId: 'q1',
      selectedOptionId: 'opt2',
      correctOptionId: 'opt2',
      topicId: 'linear-equations',
      topicTitle: 'সরল সমীকরণ',
      explanation: '2x = 8 => x = 4',
    });

    expect(result.isCorrect).toBe(true);
    expect(result.correctOptionId).toBe('opt2');
    expect(result.updatedTopicMastery).toBeGreaterThanOrEqual(50);
    expect(result.adaptiveRecommendation).toBeDefined();
    expect(result.adaptiveRecommendation.calculatedMastery).toBeGreaterThanOrEqual(50);
  });

  it('updates lesson progress and computes completion state', async () => {
    const progress = await progressRepository.markLessonComplete(studentId, lessonId, 1.0);
    expect(progress.studentId).toBe(studentId);
    expect(progress.lessonId).toBe(lessonId);
    expect(progress.completed).toBe(true);
    expect(progress.progress).toBe(1.0);
  });

  it('retrieves updated lesson progress', async () => {
    const stored = await progressRepository.getLessonProgress(studentId, lessonId);
    expect(stored.studentId).toBe(studentId);
    expect(stored.lessonId).toBe(lessonId);
  });
});
