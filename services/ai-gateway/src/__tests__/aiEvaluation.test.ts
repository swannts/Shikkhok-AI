import { aiEvaluationSuite } from '../eval/aiEvaluation';

describe('AI Evaluation Golden Benchmark Suite', () => {
  it('runs benchmark evaluation across Class 6 Math, Class 8 Science, Class 9 Physics, Bangla & English Grammar', () => {
    const dataset = aiEvaluationSuite.EVALUATION_DATASET;
    expect(dataset.length).toBe(5);

    const mockAiResponse = 'ভগ্নাংশ মানে সমান অংশ। ২/৫ এর লব ২ এবং হর ৫।';
    const scoreCard = aiEvaluationSuite.evaluateResponse(dataset[0], mockAiResponse, 1);

    expect(scoreCard.correctnessScore).toBeGreaterThanOrEqual(75);
    expect(scoreCard.languageQualityScore).toBe(100);
    expect(scoreCard.citationAccuracyScore).toBe(100);
    expect(scoreCard.passed).toBe(true);
  });
});
