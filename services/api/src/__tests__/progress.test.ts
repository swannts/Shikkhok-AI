import { progressService } from '../modules/progress/progress.service';

describe('ProgressService Unit Verification', () => {
  test('getSummary returns overall mastery and subject progress breakdown', async () => {
    const summary = await progressService.getSummary('student-1');
    expect(summary.overallMastery).toBeGreaterThan(0);
    expect(summary.subjectProgress.length).toBeGreaterThan(0);
    expect(summary.weakTopics).toBeDefined();
  });

  test('markLessonComplete creates or updates student lesson progress', async () => {
    const res = await progressService.markLessonComplete('student-1', 'linear-equations', 1.0);
    expect(res.lessonId).toBe('linear-equations');
    expect(res.completed).toBe(true);
  });
});
