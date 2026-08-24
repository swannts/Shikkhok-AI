import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { TutorGatewayReply, TutorGatewayService } from './tutor-gateway.service';

@Injectable()
export class TutorService {
  constructor(
    private readonly conversationRepository: TutorConversationRepository,
    private readonly curriculumService: CurriculumService,
    private readonly progressService: ProgressService,
    private readonly studyPlanService: StudyPlanService,
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
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
      messages: [],
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
  ): Promise<Record<string, any>> {
    await this.assertOwnershipOrAdmin(currentUser, conversationId);
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation.toJSON();
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

    const assistantReply = await this.buildAssistantReply(currentUser.userId, dto.content, conversation);

    const withUserMessage = await this.conversationRepository.appendMessage(conversationId, {
      role: TutorMessageRole.USER,
      content: dto.content.trim(),
    });
    if (!withUserMessage) {
      throw new NotFoundException('Conversation not found');
    }

    const withAssistantMessage = await this.conversationRepository.appendMessage(conversationId, {
      role: TutorMessageRole.ASSISTANT,
      content: assistantReply.content,
      citations: assistantReply.citations,
    });
    if (!withAssistantMessage) {
      throw new NotFoundException('Conversation not found');
    }

    return withAssistantMessage.toJSON();
  }

  private async buildAssistantReply(
    userId: string,
    prompt: string,
    conversation: any,
  ): Promise<{ content: string; citations: Array<Record<string, any>> }> {
    const citations: Array<Record<string, any>> = [];
    const segments: string[] = [];
    let subjectTitle = 'General Studies';
    let chapterTitle: string | undefined;
    let lessonTitle: string | undefined;

    if (conversation.lessonId) {
      try {
        const lesson = await this.curriculumService.getLesson(conversation.lessonId.toString());
        const chapter = await this.curriculumService.getChapter(conversation.chapterId.toString());
        const subject = await this.curriculumService.getSubject(conversation.subjectId.toString());
        subjectTitle = subject.title ?? subject.name ?? subject.title;
        chapterTitle = chapter.title;
        lessonTitle = lesson.title;
        citations.push({
          subjectId: conversation.subjectId.toString(),
          chapterId: conversation.chapterId.toString(),
          lessonId: conversation.lessonId.toString(),
          subjectTitle,
          chapterTitle,
          lessonTitle,
        });
        segments.push(`এই পাঠ: ${lessonTitle}`);
      } catch {
        // If curriculum context is missing, continue with generic support.
      }
    }

    const plan = await this.studyPlanService.getMyCurrentPlan({ userId, role: UserRole.STUDENT }).catch(() => null);
    const summary = await this.progressService.getMySummary({ userId, role: UserRole.STUDENT }).catch(() => null);

    if (plan?.title) {
      segments.push(`তোমার বর্তমান পরিকল্পনা: ${plan.title}`);
    }
    if (summary?.averageMastery !== undefined) {
      segments.push(`গড় মাস্তারি: ${summary.averageMastery}%`);
    }

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
      contextSegments: segments,
    });

    if (gatewayReply?.content) {
      return {
        content: gatewayReply.content,
        citations: [...citations, ...(gatewayReply.citations ?? [])],
      };
    }

    const reply = [
      'ঠিক আছে, আমি ধাপে ধাপে বুঝিয়ে দিচ্ছি।',
      segments.length ? segments.join(' • ') : 'প্রাসঙ্গিক ভিত্তি নিয়ে সাহায্য করছি।',
      `তোমার প্রশ্ন: ${prompt.trim()}`,
      'প্রথমে মূল ধারণা ধরো, তারপর ছোট উদাহরণ দিয়ে যাচাই করো।',
    ].join(' ');

    return {
      content: reply,
      citations,
    };
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

  private async assertOwnershipOrAdmin(currentUser: AuthenticatedUser, conversationId: string): Promise<void> {
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

  private async resolveClassLevel(userId: string, lessonId?: string): Promise<number> {
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
