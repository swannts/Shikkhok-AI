import { prisma } from '../../db';

export class TutorRepository {
  async getOrCreateConversation(studentId: string, title?: string, lessonId?: string, topicId?: string) {
    try {
      const existing = await prisma.tutorConversation.findFirst({
        where: { studentId, topicId },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) return existing;

      return await prisma.tutorConversation.create({
        data: {
          studentId,
          title: title || 'AI Tutor Chat',
          lessonId,
          topicId,
        },
      });
    } catch {
      return {
        id: 'conv-' + Date.now(),
        studentId,
        title: title || 'AI Tutor Chat',
        lessonId,
        topicId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async saveMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    provider?: string;
    model?: string;
    tokenUsage?: any;
  }) {
    try {
      return await prisma.tutorMessage.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          provider: data.provider,
          model: data.model,
          tokenUsage: data.tokenUsage,
        },
      });
    } catch {
      return {
        id: 'msg-' + Date.now(),
        ...data,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Fetches conversation history excluding system role messages so internal prompts are never exposed to mobile apps.
   */
  async getConversationHistory(conversationId: string, studentId: string) {
    try {
      const conversation = await prisma.tutorConversation.findFirst({
        where: { id: conversationId, studentId },
        include: {
          messages: {
            where: {
              role: { in: ['user', 'assistant'] }, // Filter out system prompts
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      return conversation;
    } catch {
      return null;
    }
  }
}

export const tutorRepository = new TutorRepository();
