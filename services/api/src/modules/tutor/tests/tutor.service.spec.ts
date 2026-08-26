import 'reflect-metadata';
import { Types } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TutorService } from '../tutor.service';
import { TutorConversationRepository } from '../repositories/tutor-conversation.repository';
import { CurriculumService } from '../../curriculum/curriculum.service';
import { ProgressService } from '../../progress/progress.service';
import { StudyPlanService } from '../../study-plan/study-plan.service';
import { StudentsService } from '../../students/students.service';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { TutorGatewayService, TutorStreamEvent } from '../tutor-gateway.service';
import { TutorMessageRepository } from '../repositories/tutor-message.repository';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';

describe('TutorService', () => {
  let service: TutorService;
  let conversationRepository: jest.Mocked<TutorConversationRepository>;
  let studyPlanService: jest.Mocked<StudyPlanService>;
  let progressService: jest.Mocked<ProgressService>;
  let tutorGatewayService: jest.Mocked<TutorGatewayService>;
  let messageRepository: jest.Mocked<TutorMessageRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorService,
        {
          provide: TutorConversationRepository,
          useValue: {
            createConversation: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            touchConversation: jest.fn(),
          },
        },
        {
          provide: TutorMessageRepository,
          useValue: {
            createMessage: jest.fn(),
            findByConversationCursor: jest.fn(),
            countByConversation: jest.fn(),
          },
        },
        {
          provide: CurriculumService,
          useValue: {
            getLesson: jest.fn(),
            getChapter: jest.fn(),
            getSubject: jest.fn(),
          },
        },
        {
          provide: ProgressService,
          useValue: {
            getMySummary: jest.fn(),
          },
        },
        {
          provide: StudyPlanService,
          useValue: {
            getMyCurrentPlan: jest.fn(),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: TutorGatewayService,
          useValue: {
            generateReply: jest.fn(),
            streamReply: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TutorService);
    conversationRepository = module.get(TutorConversationRepository);
    progressService = module.get(ProgressService);
    studyPlanService = module.get(StudyPlanService);
    tutorGatewayService = module.get(TutorGatewayService);
    messageRepository = module.get(TutorMessageRepository);
    usersService = module.get(UsersService);
  });

  it('should start a conversation and send the initial message', async () => {
    const testUserId = new Types.ObjectId().toString();
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.createConversation.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      toJSON: jest.fn(),
    } as any);
    conversationRepository.findById.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      userId: { toString: () => testUserId },
      lessonId: null,
      chapterId: null,
      subjectId: null,
    } as any);
    messageRepository.createMessage.mockResolvedValue({} as any);
    conversationRepository.touchConversation.mockResolvedValue({} as any);
    messageRepository.findByConversationCursor.mockResolvedValue([]);
    studyPlanService.getMyCurrentPlan.mockRejectedValue(new NotFoundException());
    progressService.getMySummary.mockRejectedValue(new NotFoundException());
    tutorGatewayService.generateReply.mockResolvedValue(null);

    const result = await service.startConversation(
      { userId: testUserId, role: UserRole.STUDENT },
      { title: 'Help', initialMessage: 'Explain algebra' },
    );

    expect(result).toBeDefined();
    expect(conversationRepository.createConversation).toHaveBeenCalled();
  });

  it('should reject access to missing conversations', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.findById.mockResolvedValue(null);

    await expect(
      service.getConversation({ userId: 'user-1', role: UserRole.STUDENT }, 'missing'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject access to another user conversation for non-admin', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.findById.mockResolvedValue({
      _id: 'conv-other',
      userId: { toString: () => 'user-other' },
    } as any);

    await expect(
      service.getConversation({ userId: 'user-1', role: UserRole.STUDENT }, 'conv-other'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should use the tutor gateway reply when available in regular sendMessage', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.findById.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      userId: { toString: () => 'user-1' },
      lessonId: null,
      chapterId: null,
      subjectId: null,
      classLevel: 8,
      medium: 'bangla',
    } as any);
    messageRepository.createMessage.mockResolvedValue({} as any);
    conversationRepository.touchConversation.mockResolvedValue({} as any);
    messageRepository.findByConversationCursor.mockResolvedValue([
      {
        toJSON: jest.fn().mockReturnValue({
          content: 'gateway reply',
          createdAt: '2026-08-24T00:00:00.000Z',
          _id: 'msg-2',
        }),
      },
    ] as any);
    tutorGatewayService.generateReply.mockResolvedValue({
      content: 'gateway reply',
      citations: [{ sourceBook: 'NCTB' }],
      fallbackUsed: false,
      citationCount: 1,
    });
    studyPlanService.getMyCurrentPlan.mockRejectedValue(new NotFoundException());
    progressService.getMySummary.mockRejectedValue(new NotFoundException());

    const result = await service.sendMessage(
      { userId: 'user-1', role: UserRole.STUDENT },
      'conv-1',
      { content: 'Explain algebra' },
    );

    expect(tutorGatewayService.generateReply).toHaveBeenCalled();
    expect(result.messages?.[0]?.content).toBe('gateway reply');
  });

  it('should stream AI tutor response with SSE frames and persist assistant message with citations', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.findById.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      userId: { toString: () => 'user-1' },
      lessonId: null,
      chapterId: null,
      subjectId: null,
      classLevel: 8,
      medium: 'bangla',
    } as any);
    messageRepository.createMessage.mockResolvedValue({
      _id: { toString: () => 'asst-msg-1' },
    } as any);
    conversationRepository.touchConversation.mockResolvedValue({} as any);
    studyPlanService.getMyCurrentPlan.mockRejectedValue(new NotFoundException());
    progressService.getMySummary.mockRejectedValue(new NotFoundException());

    // Mock streamReply generator
    async function* mockStream(): AsyncIterable<TutorStreamEvent> {
      yield { event: 'metadata', data: { provider: 'gemini', model: 'gemini-1.5-pro' } };
      yield { event: 'delta', data: { text: 'বীজগণিতের ' } };
      yield { event: 'delta', data: { text: 'মূল ধারণা হলো চলক।' } };
      yield { event: 'citation', data: { sourceBook: 'NCTB Class 8 Math', pageNumber: 45 } };
      yield { event: 'done', data: { latencyMs: 250 } };
    }
    tutorGatewayService.streamReply.mockImplementation(mockStream as any);

    const writtenChunks: string[] = [];
    const mockRes: any = {
      setHeader: jest.fn(),
      write: jest.fn((chunk: string) => {
        writtenChunks.push(chunk);
        return true;
      }),
      end: jest.fn(),
      flushHeaders: jest.fn(),
    };
    const mockReq: any = {
      on: jest.fn(),
    };

    await service.streamMessage(
      { userId: 'user-1', role: UserRole.STUDENT },
      'conv-1',
      { content: 'বীজগণিত কী?' },
      mockRes,
      mockReq,
    );

    // 1. Check SSE response headers
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');

    // 2. Check user message saved
    expect(messageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        role: TutorMessageRole.USER,
        content: 'বীজগণিত কী?',
      }),
    );

    // 3. Check SSE frames written
    const combinedOutput = writtenChunks.join('');
    expect(combinedOutput).toContain('event: metadata');
    expect(combinedOutput).toContain('event: delta');
    expect(combinedOutput).toContain('বীজগণিতের');
    expect(combinedOutput).toContain('event: citation');
    expect(combinedOutput).toContain('NCTB Class 8 Math');
    expect(combinedOutput).toContain('event: done');

    // 4. Check assistant message persisted to MongoDB
    expect(messageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        role: TutorMessageRole.ASSISTANT,
        content: 'বীজগণিতের মূল ধারণা হলো চলক।',
        citations: expect.arrayContaining([
          expect.objectContaining({ sourceBook: 'NCTB Class 8 Math', pageNumber: 45 }),
        ]),
        provider: 'gemini',
      }),
    );

    // 5. Check conversation touched & ended
    expect(conversationRepository.touchConversation).toHaveBeenCalledWith('conv-1', 2);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should paginate tutor messages using an opaque cursor', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.findById.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      userId: { toString: () => 'user-1' },
      lessonId: null,
      chapterId: null,
      subjectId: null,
      classLevel: 8,
      medium: 'bangla',
    } as any);
    messageRepository.findByConversationCursor.mockResolvedValue([
      {
        toJSON: jest.fn().mockReturnValue({
          _id: 'msg-4',
          content: 'four',
          createdAt: '2026-08-24T00:04:00.000Z',
        }),
      },
      {
        toJSON: jest.fn().mockReturnValue({
          _id: 'msg-3',
          content: 'three',
          createdAt: '2026-08-24T00:03:00.000Z',
        }),
      },
      {
        toJSON: jest.fn().mockReturnValue({
          _id: 'msg-2',
          content: 'two',
          createdAt: '2026-08-24T00:02:00.000Z',
        }),
      },
      {
        toJSON: jest.fn().mockReturnValue({
          _id: 'msg-1',
          content: 'one',
          createdAt: '2026-08-24T00:01:00.000Z',
        }),
      },
    ] as any);

    const result = await service.getConversation(
      { userId: 'user-1', role: UserRole.STUDENT },
      'conv-1',
      3,
    );

    expect(result.messages?.map((message: any) => message._id)).toEqual([
      'msg-2',
      'msg-3',
      'msg-4',
    ]);
    expect(result.messageMeta?.hasNext).toBe(true);

    const nextCursor = result.messageMeta?.nextCursor;
    expect(nextCursor).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(nextCursor!, 'base64url').toString('utf8'));
    expect(decoded.id).toBe('msg-2');
  });
});
