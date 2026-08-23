import { masteryEngine } from '../modules/practice/mastery.engine';

describe('MasteryEngine (Adaptive Learning)', () => {
  it('recommends EASY_REINFORCEMENT when calculated mastery < 40', () => {
    const recommendation = masteryEngine.getAdaptiveRecommendation({
      topicMastery: 30,
      accuracy: 35,
      attemptCount: 5,
      timeSpentSeconds: 120,
      recentPerformance: [false, false, true],
      weakTopicsCount: 2,
      completedLessonsCount: 1,
    });

    expect(recommendation.difficulty).toBe('EASY_REINFORCEMENT');
    expect(recommendation.nextStep).toBe('REINFORCE');
    expect(recommendation.calculatedMastery).toBeLessThan(40);
  });

  it('recommends STANDARD_PRACTICE when calculated mastery is between 40 and 69', () => {
    const recommendation = masteryEngine.getAdaptiveRecommendation({
      topicMastery: 55,
      accuracy: 60,
      attemptCount: 10,
      timeSpentSeconds: 300,
      recentPerformance: [true, false, true],
      weakTopicsCount: 1,
      completedLessonsCount: 3,
    });

    expect(recommendation.difficulty).toBe('STANDARD_PRACTICE');
    expect(recommendation.nextStep).toBe('PRACTICE');
    expect(recommendation.calculatedMastery).toBeGreaterThanOrEqual(40);
    expect(recommendation.calculatedMastery).toBeLessThan(70);
  });

  it('recommends HARD_CHALLENGE when calculated mastery is between 70 and 89', () => {
    const recommendation = masteryEngine.getAdaptiveRecommendation({
      topicMastery: 78,
      accuracy: 80,
      attemptCount: 15,
      timeSpentSeconds: 450,
      recentPerformance: [true, true, true],
      weakTopicsCount: 0,
      completedLessonsCount: 5,
    });

    expect(recommendation.difficulty).toBe('HARD_CHALLENGE');
    expect(recommendation.nextStep).toBe('CHALLENGE');
    expect(recommendation.calculatedMastery).toBeGreaterThanOrEqual(70);
    expect(recommendation.calculatedMastery).toBeLessThan(90);
  });

  it('recommends ADVANCE_RECOMMENDED when calculated mastery >= 90', () => {
    const recommendation = masteryEngine.getAdaptiveRecommendation({
      topicMastery: 95,
      accuracy: 92,
      attemptCount: 20,
      timeSpentSeconds: 600,
      recentPerformance: [true, true, true],
      weakTopicsCount: 0,
      completedLessonsCount: 8,
    });

    expect(recommendation.difficulty).toBe('ADVANCE_RECOMMENDED');
    expect(recommendation.nextStep).toBe('NEXT_CHAPTER');
    expect(recommendation.calculatedMastery).toBeGreaterThanOrEqual(90);
  });
});
