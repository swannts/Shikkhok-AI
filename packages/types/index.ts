// Centralized Shared Types for API & Mobile App Sync

export interface StudentProfileDto {
  id: string;
  userId: string;
  class: string;
  medium: 'bangla' | 'english';
  schoolName?: string;
  district?: string;
  dailyGoalMinutes: number;
}

export interface PracticeQuestionAttemptDto {
  studentId: string;
  questionId: string;
  selectedOptionId?: string;
  correctOptionId: string;
  responsePayload?: Record<string, any>;
  topicId: string;
  topicTitle: string;
  explanation: string;
}

export interface PracticeResultDto {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  updatedTopicMastery: number;
  adaptiveRecommendation: {
    recommendedDifficulty: string;
    calculatedMastery: number;
    reasoning: string;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  data?: T;
  message?: string;
  banglaMessage?: string;
  errorCode?: string;
  details?: Record<string, any>;
  requestId?: string;
}
