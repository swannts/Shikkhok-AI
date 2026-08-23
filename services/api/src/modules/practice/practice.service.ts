import { practiceRepository } from './practice.repository';
import { masteryEngine } from './mastery.engine';

export interface EvaluateAnswerDto {
  studentId: string;
  practiceSessionId?: string;
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  topicId: string;
  topicTitle: string;
  explanation: string;
}

export class PracticeService {
  async startSession(studentId: string, topicTitle: string, totalQuestions: number = 5, initialMastery: number = 50) {
    return await practiceRepository.createPracticeSession(studentId, topicTitle, totalQuestions, initialMastery);
  }

  async evaluateAndPersistAnswer(dto: EvaluateAnswerDto) {
    const isCorrect = dto.selectedOptionId === dto.correctOptionId;

    // 1. Persist QuestionAttempt
    const attempt = await practiceRepository.recordAttempt({
      studentId: dto.studentId,
      practiceSessionId: dto.practiceSessionId,
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
      isCorrect,
    });

    // 2. Update Topic Mastery (Source of Truth on Backend)
    const topicMastery = await practiceRepository.updateTopicMastery(
      dto.studentId,
      dto.topicId,
      dto.topicTitle,
      isCorrect
    );

    // 3. Centralized Adaptive Learning Engine Recommendation
    const adaptiveRec = masteryEngine.getAdaptiveRecommendation({
      topicMastery: topicMastery.masteryPercentage,
      accuracy: isCorrect ? 100 : 0,
      attemptCount: topicMastery.totalAttempts,
      timeSpentSeconds: 30,
      recentPerformance: [isCorrect],
      weakTopicsCount: isCorrect ? 0 : 1,
      completedLessonsCount: 1,
    });

    // 4. Return immediate feedback & adaptive next step to client
    return {
      attemptId: attempt.id,
      isCorrect,
      correctOptionId: dto.correctOptionId,
      explanation: dto.explanation,
      updatedTopicMastery: topicMastery.masteryPercentage,
      adaptiveRecommendation: adaptiveRec,
    };
  }

  async submitSessionSummary(
    sessionId: string,
    data: {
      correctAnswers: number;
      totalQuestions: number;
      timeSpentSeconds: number;
      initialMastery: number;
      weakTopics: string[];
    }
  ) {
    const accuracyPercentage = Math.round((data.correctAnswers / Math.max(1, data.totalQuestions)) * 100);
    const updatedMastery = Math.min(100, Math.max(0, data.initialMastery + Math.round((accuracyPercentage - 50) / 5)));

    return await practiceRepository.finalizePracticeSession(sessionId, {
      correctAnswers: data.correctAnswers,
      totalQuestions: data.totalQuestions,
      accuracyPercentage,
      timeSpentSeconds: data.timeSpentSeconds,
      updatedMastery,
      weakTopics: data.weakTopics,
    });
  }
}

export const practiceService = new PracticeService();
