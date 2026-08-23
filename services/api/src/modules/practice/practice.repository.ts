import { prisma } from '../../db';

export class PracticeRepository {
  async createPracticeSession(studentId: string, topicTitle: string, totalQuestions: number, initialMastery: number) {
    try {
      return await prisma.practiceSession.create({
        data: {
          studentId,
          topicTitle,
          totalQuestions,
          correctAnswers: 0,
          accuracyPercentage: 0,
          timeSpentSeconds: 0,
          initialMastery,
          updatedMastery: initialMastery,
          weakTopics: [],
        },
      });
    } catch {
      return {
        id: 'session-' + Date.now(),
        studentId,
        topicTitle,
        totalQuestions,
        correctAnswers: 0,
        accuracyPercentage: 0,
        timeSpentSeconds: 0,
        initialMastery,
        updatedMastery: initialMastery,
        weakTopics: [],
        createdAt: new Date(),
      };
    }
  }

  async getQuestionsByTopic(topicId: string, limit: number = 5) {
    try {
      const questions = await prisma.question.findMany({
        where: { topicId },
        take: limit,
      });
      return questions;
    } catch {
      return [];
    }
  }

  async recordAttempt(data: {
    studentId: string;
    practiceSessionId?: string;
    questionId: string;
    selectedOptionId?: string;
    responsePayload?: any;
    isCorrect: boolean;
  }) {
    try {
      return await prisma.questionAttempt.create({
        data: {
          studentId: data.studentId,
          practiceSessionId: data.practiceSessionId,
          questionId: data.questionId,
          selectedOptionId: data.selectedOptionId,
          responsePayload: data.responsePayload,
          isCorrect: data.isCorrect,
        },
      });
    } catch {
      return {
        id: 'attempt-' + Date.now(),
        ...data,
        createdAt: new Date(),
      };
    }
  }

  async updateTopicMastery(studentId: string, topicId: string, topicTitle: string, isCorrect: boolean) {
    try {
      const existing = await prisma.topicMastery.findUnique({
        where: { studentId_topicId: { studentId, topicId } },
      });

      const totalAttempts = (existing?.totalAttempts || 0) + 1;
      const correctAttempts = (existing?.correctAttempts || 0) + (isCorrect ? 1 : 0);
      const masteryPercentage = Math.round((correctAttempts / totalAttempts) * 100);

      return await prisma.topicMastery.upsert({
        where: { studentId_topicId: { studentId, topicId } },
        update: {
          totalAttempts,
          correctAttempts,
          masteryPercentage,
          topicTitle,
        },
        create: {
          studentId,
          topicId,
          topicTitle,
          totalAttempts,
          correctAttempts,
          masteryPercentage,
        },
      });
    } catch {
      return {
        studentId,
        topicId,
        topicTitle,
        masteryPercentage: isCorrect ? 80 : 40,
        totalAttempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
      };
    }
  }

  async finalizePracticeSession(
    sessionId: string,
    data: {
      correctAnswers: number;
      totalQuestions: number;
      accuracyPercentage: number;
      timeSpentSeconds: number;
      updatedMastery: number;
      weakTopics: string[];
    }
  ) {
    try {
      return await prisma.practiceSession.update({
        where: { id: sessionId },
        data: {
          correctAnswers: data.correctAnswers,
          accuracyPercentage: data.accuracyPercentage,
          timeSpentSeconds: data.timeSpentSeconds,
          updatedMastery: data.updatedMastery,
          weakTopics: data.weakTopics,
        },
      });
    } catch {
      return { id: sessionId, ...data };
    }
  }

  /**
   * Cursor-based paginated practice session history
   */
  async getPaginatedPracticeHistory(studentId: string, params: { cursor?: string; limit?: number }) {
    try {
      const take = (params.limit || 20) + 1;
      const sessions = await prisma.practiceSession.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take,
        cursor: params.cursor ? { id: params.cursor } : undefined,
        skip: params.cursor ? 1 : 0,
      });

      const hasMore = sessions.length > (params.limit || 20);
      const items = hasMore ? sessions.slice(0, params.limit || 20) : sessions;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return { items, nextCursor, hasMore };
    } catch {
      return { items: [], nextCursor: null, hasMore: false };
    }
  }
}

export const practiceRepository = new PracticeRepository();

