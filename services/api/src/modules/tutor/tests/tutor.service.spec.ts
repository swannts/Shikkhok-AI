import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TutorService } from '../tutor.service';
import { TutorConversationRepository } from '../repositories/tutor-conversation.repository';
import { CurriculumService } from '../../curriculum/curriculum.service';
import { ProgressService } from '../../progress/progress.service';
import { StudyPlanService } from '../../study-plan/study-plan.service';
import { StudentsService } from '../../students/students.service';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { TutorGatewayService } from '../tutor-gateway.service';

describe('TutorService', () => {
  let service: TutorService;
  let conversationRepository: jest.Mocked<TutorConversationRepository>;
  let curriculumService: jest.Mocked<CurriculumService>;
  let progressService: jest.Mocked<ProgressService>;
  let studyPlanService: jest.Mocked<StudyPlanService>;
  let tutorGatewayService: jest.Mocked<TutorGatewayService>;
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
            appendMessage: jest.fn(),
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
          },
        },
      ],
    }).compile();

    service = module.get(TutorService);
    conversationRepository = module.get(TutorConversationRepository);
    curriculumService = module.get(CurriculumService);
    progressService = module.get(ProgressService);
    studyPlanService = module.get(StudyPlanService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const studentsService = module.get(StudentsService);
    tutorGatewayService = module.get(TutorGatewayService);
    usersService = module.get(UsersService);
  });

  it('should start a conversation and send the initial message', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    conversationRepository.createConversation.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      toJSON: jest.fn(),
    } as any);
    conversationRepository.findById.mockResolvedValue({
      _id: { toString: () => 'conv-1' },
      userId: { toString: () => 'user-1' },
      lessonId: null,
      chapterId: null,
      subjectId: null,
    } as any);
    conversationRepository.appendMessage.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ messages: [] }),
    } as any);
    studyPlanService.getMyCurrentPlan.mockRejectedValue(new NotFoundException());
    progressService.getMySummary.mockRejectedValue(new NotFoundException());
    tutorGatewayService.generateReply.mockResolvedValue(null);

    const result = await service.startConversation(
      { userId: 'user-1', role: UserRole.STUDENT },
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

  it('should use the tutor gateway reply when available', async () => {
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
    conversationRepository.appendMessage.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ messages: [{ content: 'gateway reply' }] }),
    } as any);
    tutorGatewayService.generateReply.mockResolvedValue({
      content: 'gateway reply',
      citations: [{ sourceBook: 'NCTB' }],
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
});
