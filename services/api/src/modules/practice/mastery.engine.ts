export type AdaptiveDifficulty = 'EASY_REINFORCEMENT' | 'STANDARD_PRACTICE' | 'HARD_CHALLENGE' | 'ADVANCE_RECOMMENDED';

export interface MasteryMetrics {
  topicMastery: number;
  accuracy: number;
  attemptCount: number;
  timeSpentSeconds: number;
  recentPerformance: boolean[];
  weakTopicsCount: number;
  completedLessonsCount: number;
}

export interface AdaptiveRecommendation {
  difficulty: AdaptiveDifficulty;
  recommendationMessage: string;
  banglaMessage: string;
  calculatedMastery: number;
  nextStep: 'REINFORCE' | 'PRACTICE' | 'CHALLENGE' | 'NEXT_CHAPTER';
}

export class MasteryEngine {
  /**
   * Deterministic mastery score calculation based on performance signals
   */
  public calculateMasteryScore(metrics: MasteryMetrics): number {
    const { topicMastery, accuracy, attemptCount, recentPerformance } = metrics;

    if (attemptCount === 0) {
      return topicMastery;
    }

    // Weight recent attempts higher (last 3 attempts)
    const recentAttempts = recentPerformance.slice(-3);
    const recentAccuracy =
      recentAttempts.length > 0
        ? Math.round((recentAttempts.filter(Boolean).length / recentAttempts.length) * 100)
        : accuracy;

    // Weighted formula: 40% overall topic mastery, 40% overall accuracy, 20% recent accuracy trend
    const weightedScore = Math.round(topicMastery * 0.4 + accuracy * 0.4 + recentAccuracy * 0.2);

    return Math.min(100, Math.max(0, weightedScore));
  }

  /**
   * Centralized adaptive decision matrix
   */
  public getAdaptiveRecommendation(metrics: MasteryMetrics): AdaptiveRecommendation {
    const masteryScore = this.calculateMasteryScore(metrics);

    if (masteryScore < 40) {
      return {
        difficulty: 'EASY_REINFORCEMENT',
        recommendationMessage: 'Focus on easy reinforcement questions and concept review.',
        banglaMessage: 'সহজ প্রশ্ন এবং ধারণার মূলবিষয় পুনরায় ঝালাই করুন।',
        calculatedMastery: masteryScore,
        nextStep: 'REINFORCE',
      };
    }

    if (masteryScore >= 40 && masteryScore < 70) {
      return {
        difficulty: 'STANDARD_PRACTICE',
        recommendationMessage: 'Continue standard practice to build consistency.',
        banglaMessage: 'নিয়মিত অনুশীলনের মাধ্যমে আপনার দক্ষতা বৃদ্ধি করুন।',
        calculatedMastery: masteryScore,
        nextStep: 'PRACTICE',
      };
    }

    if (masteryScore >= 70 && masteryScore < 90) {
      return {
        difficulty: 'HARD_CHALLENGE',
        recommendationMessage: 'Try harder challenge questions to achieve complete mastery.',
        banglaMessage: 'সম্পূর্ণ পারদর্শিতা অর্জনের জন্য চ্যালেঞ্জিং প্রশ্নের সমাধান করুন।',
        calculatedMastery: masteryScore,
        nextStep: 'CHALLENGE',
      };
    }

    return {
      difficulty: 'ADVANCE_RECOMMENDED',
      recommendationMessage: 'Mastery achieved! Recommended moving forward to the next topic.',
      banglaMessage: 'উৎকর্ষ অর্জিত হয়েছে! পরবর্তী অধ্যায়ে এগিয়ে যাওয়ার পরামর্শ দেওয়া হচ্ছে।',
      calculatedMastery: masteryScore,
      nextStep: 'NEXT_CHAPTER',
    };
  }
}

export const masteryEngine = new MasteryEngine();
