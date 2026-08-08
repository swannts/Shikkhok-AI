import { practiceRepository } from '../api/repositories/practiceRepository';

describe('Practice Domain Assessment Evaluation', () => {
  test('evaluates 100% correct answers ratio and calculates updated mastery', async () => {
    const allCorrectAnswers = {
      q1: 'C',
      q2: 'A',
      q3: 'B',
      q4: 'C',
      q5: 'A',
    };

    const result = await practiceRepository.submitPracticeResults(
      'session-1',
      allCorrectAnswers,
      120
    );

    expect(result.correctAnswers).toBe(5);
    expect(result.totalQuestions).toBe(5);
    expect(result.accuracyPercentage).toBe(100);
    expect(result.updatedMastery).toBe(62); // 42 + 20
    expect(result.weakTopics.length).toBe(0);
  });

  test('evaluates 0% correct answers ratio and identifies weak topics', async () => {
    const wrongAnswers = {
      q1: 'A',
      q2: 'B',
      q3: 'A',
      q4: 'A',
      q5: 'B',
    };

    const result = await practiceRepository.submitPracticeResults('session-1', wrongAnswers, 90);

    expect(result.correctAnswers).toBe(0);
    expect(result.totalQuestions).toBe(5);
    expect(result.accuracyPercentage).toBe(0);
    expect(result.updatedMastery).toBe(42);
    expect(result.weakTopics.length).toBeGreaterThan(0);
  });
});
