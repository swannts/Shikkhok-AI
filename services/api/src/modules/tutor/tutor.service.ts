import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { StudentsService } from '../students/students.service';
import { CurriculumService } from '../curriculum/curriculum.service';
import { ProgressService } from '../progress/progress.service';
import { StudyPlanService } from '../study-plan/study-plan.service';
import { StartTutorConversationDto } from './dto/start-tutor-conversation.dto';
import { SendTutorMessageDto } from './dto/send-tutor-message.dto';
import { TutorConversationRepository } from './repositories/tutor-conversation.repository';
import { TutorMessageRole } from './enums/tutor-message-role.enum';
import { TutorGatewayService, TutorGatewayRequest } from './tutor-gateway.service';
import { TutorMessageRepository } from './repositories/tutor-message.repository';
import { TutorCitation } from './types/tutor-citation.type';

@Injectable()
export class TutorService {
  constructor(
    private readonly conversationRepository: TutorConversationRepository,
    private readonly curriculumService: CurriculumService,
    private readonly progressService: ProgressService,
    private readonly studyPlanService: StudyPlanService,
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
    private readonly messageRepository: TutorMessageRepository,
    private readonly tutorGatewayService: TutorGatewayService,
  ) {}

  async startConversation(
    currentUser: AuthenticatedUser,
    dto: StartTutorConversationDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const conversation = await this.conversationRepository.createConversation({
      userId: currentUser.userId as any,
      title: dto.title?.trim() || 'নতুন AI টিউটর আলাপ',
      subjectId: dto.subjectId ? (dto.subjectId as any) : null,
      chapterId: dto.chapterId ? (dto.chapterId as any) : null,
      lessonId: dto.lessonId ? (dto.lessonId as any) : null,
      classLevel: await this.resolveClassLevel(currentUser.userId),
      medium: await this.resolveMedium(currentUser.userId),
      curriculumYear: String(await this.resolveCurriculumYear(currentUser.userId)),
      messageCount: 0,
      lastMessageAt: new Date(),
    });

    if (dto.initialMessage) {
      return this.sendMessage(currentUser, conversation._id.toString(), {
        content: dto.initialMessage,
      });
    }

    return conversation.toJSON();
  }

  async getMyConversations(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.assertStudentOrAdmin(currentUser);
    const conversations = await this.conversationRepository.findByUserId(currentUser.userId);
    return conversations.map((conversation) => conversation.toJSON());
  }

  async getConversation(
    currentUser: AuthenticatedUser,
    conversationId: string,
    limit = 30,
    cursor?: string,
  ): Promise<Record<string, any>> {
    await this.assertOwnershipOrAdmin(currentUser, conversationId);
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.getConversationMessagesInternal(conversationId, limit, cursor);
    const conversationData =
      typeof conversation.toJSON === 'function' ? conversation.toJSON() : conversation;
    return {
      ...conversationData,
      messages: messages.data,
      messageMeta: messages.meta,
    };
  }

  async getConversationMessages(
    currentUser: AuthenticatedUser,
    conversationId: string,
    limit = 30,
    cursor?: string,
  ): Promise<Record<string, any>> {
    await this.assertOwnershipOrAdmin(currentUser, conversationId);
    return this.getConversationMessagesInternal(conversationId, limit, cursor);
  }

  async sendMessage(
    currentUser: AuthenticatedUser,
    conversationId: string,
    dto: SendTutorMessageDto,
  ): Promise<Record<string, any>> {
    await this.assertOwnershipOrAdmin(currentUser, conversationId);

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const assistantReply = await this.buildAssistantReply(
      currentUser.userId,
      dto.content,
      conversation,
    );

    await this.messageRepository.createMessage({
      conversationId,
      userId: currentUser.userId,
      role: TutorMessageRole.USER,
      content: dto.content.trim(),
    });

    await this.messageRepository.createMessage({
      conversationId,
      userId: currentUser.userId,
      role: TutorMessageRole.ASSISTANT,
      content: assistantReply.content,
      citations: assistantReply.citations,
      provider: assistantReply.provider,
    });
    await this.conversationRepository.touchConversation(conversationId, 2);

    return this.getConversation(currentUser, conversationId);
  }

  async streamMessage(
    currentUser: AuthenticatedUser,
    conversationId: string,
    dto: SendTutorMessageDto,
    res: Response,
    req?: Request,
  ): Promise<void> {
    await this.assertOwnershipOrAdmin(currentUser, conversationId);

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const abortController = new AbortController();
    req?.on('close', () => {
      abortController.abort();
    });

    // 1. Save user message to database
    await this.messageRepository.createMessage({
      conversationId,
      userId: currentUser.userId,
      role: TutorMessageRole.USER,
      content: dto.content.trim(),
    });

    // 2. Prepare Context
    const {
      contextSegments,
      citations: baseCitations,
      subjectTitle,
    } = await this.prepareContext(currentUser.userId, conversation);

    const gatewayRequest: TutorGatewayRequest = {
      conversationId,
      userId: currentUser.userId,
      prompt: dto.content,
      lessonId: conversation.lessonId?.toString?.() ?? null,
      topicId: conversation.chapterId?.toString?.() ?? conversation.subjectId?.toString?.() ?? null,
      classLevel: conversation.classLevel ?? (await this.resolveClassLevel(currentUser.userId)),
      subject: subjectTitle,
      language: conversation.medium === 'english' ? 'en' : 'bn',
      medium: conversation.medium,
      provider: 'gemini',
      contextSegments,
    };

    let accumulatedContent = '';
    const collectedCitations: TutorCitation[] = [...baseCitations];
    let provider = 'gemini';

    try {
      for await (const event of this.tutorGatewayService.streamReply(
        gatewayRequest,
        abortController.signal,
      )) {
        if (abortController.signal.aborted) {
          break;
        }

        if (event.event === 'metadata') {
          if (event.data?.provider) {
            provider = event.data.provider;
          }
          res.write(`event: metadata\ndata: ${JSON.stringify(event.data)}\n\n`);
        } else if (event.event === 'delta') {
          if (typeof event.data?.text === 'string') {
            accumulatedContent += event.data.text;
          }
          res.write(`event: delta\ndata: ${JSON.stringify(event.data)}\n\n`);
        } else if (event.event === 'citation') {
          collectedCitations.push(event.data as TutorCitation);
          res.write(`event: citation\ndata: ${JSON.stringify(event.data)}\n\n`);
        } else if (event.event === 'error') {
          res.write(`event: error\ndata: ${JSON.stringify(event.data)}\n\n`);
        }
      }

      // 3. Persist final assistant message
      const assistantMessage = await this.messageRepository.createMessage({
        conversationId,
        userId: currentUser.userId,
        role: TutorMessageRole.ASSISTANT,
        content: accumulatedContent.trim() || 'উত্তরের অনুরোধ সম্পন্ন হয়েছে।',
        citations: collectedCitations,
        provider,
      });

      await this.conversationRepository.touchConversation(conversationId, 2);

      // 4. Emit done event
      res.write(
        `event: done\ndata: ${JSON.stringify({
          messageId: assistantMessage._id?.toString?.(),
          conversationId,
        })}\n\n`,
      );
    } catch (error: any) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          code: 'STREAM_FAILED',
          message: error?.message ?? 'Streaming error occurred',
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  private async prepareContext(
    userId: string,
    conversation: any,
  ): Promise<{
    contextSegments: string[];
    citations: TutorCitation[];
    subjectTitle: string;
  }> {
    const citations: TutorCitation[] = [];
    const contextSegments: string[] = [];
    let subjectTitle = 'General Studies';

    if (conversation.lessonId) {
      try {
        const lesson = await this.curriculumService.getLesson(conversation.lessonId.toString());
        const chapter = await this.curriculumService.getChapter(conversation.chapterId.toString());
        const subject = await this.curriculumService.getSubject(conversation.subjectId.toString());
        subjectTitle = subject.title ?? subject.name ?? 'General Studies';
        citations.push({
          sourceId: conversation.lessonId.toString(),
          sourceBook: 'curriculum-context',
          classLevel: conversation.classLevel,
          subject: subjectTitle,
          chapter: chapter.title,
          excerpt: lesson.title,
        });
        contextSegments.push(`এই পাঠ: ${lesson.title}`);
      } catch {
        // Fallback gracefully
      }
    }

    const plan = await this.studyPlanService
      .getMyCurrentPlan({ userId, role: UserRole.STUDENT })
      .catch(() => null);
    const summary = await this.progressService
      .getMySummary({ userId, role: UserRole.STUDENT })
      .catch(() => null);

    if (plan?.title) {
      contextSegments.push(`তোমার বর্তমান পরিকল্পনা: ${plan.title}`);
    }
    if (summary?.averageMastery !== undefined) {
      contextSegments.push(`গড় মাস্তারি: ${summary.averageMastery}%`);
    }

    return {
      contextSegments,
      citations,
      subjectTitle,
    };
  }

  private async buildAssistantReply(
    userId: string,
    prompt: string,
    conversation: any,
  ): Promise<{ content: string; citations: TutorCitation[]; provider?: string }> {
    const { contextSegments, citations, subjectTitle } = await this.prepareContext(
      userId,
      conversation,
    );

    const gatewayReply = await this.tutorGatewayService.generateReply({
      conversationId: conversation._id?.toString?.(),
      userId,
      prompt,
      lessonId: conversation.lessonId?.toString?.() ?? null,
      topicId: conversation.chapterId?.toString?.() ?? conversation.subjectId?.toString?.() ?? null,
      classLevel: conversation.classLevel ?? (await this.resolveClassLevel(userId)),
      subject: subjectTitle,
      language: conversation.medium === 'english' ? 'en' : 'bn',
      medium: conversation.medium,
      provider: 'gemini',
      contextSegments,
    });

    if (gatewayReply?.content) {
      return {
        content: gatewayReply.content,
        citations: [...citations, ...(gatewayReply.citations ?? [])],
        provider: gatewayReply.provider,
      };
    }

    const reply = [
      'ঠিক আছে, আমি ধাপে ধাপে বুঝিয়ে দিচ্ছি।',
      contextSegments.length ? contextSegments.join(' • ') : 'প্রাসঙ্গিক ভিত্তি নিয়ে সাহায্য করছি।',
      `তোমার প্রশ্ন: ${prompt.trim()}`,
      'প্রথমে মূল ধারণা ধরো, তারপর ছোট উদাহরণ দিয়ে যাচাই করো।',
    ].join(' ');

    return {
      content: reply,
      citations,
    };
  }

  private async getConversationMessagesInternal(
    conversationId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    data: Record<string, any>[];
    meta: { nextCursor: string | null; hasNext: boolean };
  }> {
    const pageLimit = Math.max(1, Math.min(limit || 30, 50));
    const decodedCursor = this.decodeCursor(cursor);
    const messages = await this.messageRepository.findByConversationCursor(
      conversationId,
      pageLimit + 1,
      decodedCursor,
    );
    const hasNext = messages.length > pageLimit;
    const data = messages
      .slice(0, pageLimit)
      .map((message) => message.toJSON())
      .reverse();
    const firstItem = data[0];
    return {
      data,
      meta: {
        nextCursor:
          hasNext && firstItem
            ? this.encodeCursor(
                new Date(firstItem.createdAt).toISOString(),
                firstItem._id.toString(),
              )
            : null,
        hasNext,
      },
    };
  }

  private encodeCursor(createdAt: string, id: string): string {
    return Buffer.from(JSON.stringify({ createdAt, id }), 'utf8').toString('base64url');
  }

  private decodeCursor(cursor?: string): { createdAt: string; id: string } | undefined {
    if (!cursor) {
      return undefined;
    }

    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (decoded?.createdAt && decoded?.id) {
        return decoded;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private async assertStudentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can access tutor conversations');
    }
  }

  private async assertOwnershipOrAdmin(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      return;
    }

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== currentUser.userId) {
      throw new ForbiddenException('You can only access your own tutor conversations');
    }
  }

  private async resolveClassLevel(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.classLevel ?? 8;
    } catch {
      return 8;
    }
  }

  private async resolveMedium(userId: string): Promise<string> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.medium ?? 'bangla';
    } catch {
      return 'bangla';
    }
  }

  private async resolveCurriculumYear(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.curriculumYear ?? 2026;
    } catch {
      return 2026;
    }
  }
}
