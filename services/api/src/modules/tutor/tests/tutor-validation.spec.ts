import { Test, TestingModule } from '@nestjs/testing';
import { TutorService } from '../tutor.service';
import { TutorConversationRepository } from '../repositories/tutor-conversation.repository';
import { TutorMessageRepository } from '../repositories/tutor-message.repository';
import { AiGatewayService } from '../../ai-gateway/services/ai-gateway.service';
import { CurriculumService } from '../../curriculum/curriculum.service';
import { StudentsService } from '../../students/students.service';
import { UsersService } from '../../users/users.service';
import { StudyPlanService } from '../../study-plan/study-plan.service';
import { ProgressService } from '../../progress/progress.service';
import { BadRequestException } from '@nestjs/common';

describe('TutorService - Phase 2 Validation', () => {
  let service: TutorService;
  let studentsService: jest.Mocked<StudentsService>;

  beforeEach(async () => {
    studentsService = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<StudentsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorService,
        {
          provide: UsersService,
          useValue: {
            findById: jest
              .fn()
              .mockResolvedValue({
                _id: { toString: () => '123' },
                userId: { toString: () => 'user-1' },
              })
              .mockResolvedValue({ _id: 'user-1', role: 'student' }),
          },
        },
        {
          provide: TutorConversationRepository,
          useValue: {
            createConversation: jest
              .fn()
              .mockResolvedValue({ _id: { toString: () => '123' }, toJSON: () => ({}) }),
            findById: jest
              .fn()
              .mockResolvedValue({
                _id: { toString: () => '123' },
                userId: { toString: () => 'user-1' },
              }),
          },
        },
        {
          provide: TutorMessageRepository,
          useValue: {
            createConversation: jest
              .fn()
              .mockResolvedValue({ _id: { toString: () => '123' }, toJSON: () => ({}) }),
            findById: jest
              .fn()
              .mockResolvedValue({
                _id: { toString: () => '123' },
                userId: { toString: () => 'user-1' },
              }),
          },
        },
        {
          provide: AiGatewayService,
          useValue: { streamTutorResponse: jest.fn() },
        },
        {
          provide: CurriculumService,
          useValue: {},
        },
        {
          provide: StudentsService,
          useValue: studentsService,
        },
        {
          provide: StudyPlanService,
          useValue: {},
        },
        {
          provide: ProgressService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TutorService>(TutorService);
  });

  it('should throw BadRequestException if student classLevel is missing', async () => {
    studentsService.getProfileByUserId.mockResolvedValueOnce({
      classLevel: undefined,
    } as any);

    await expect(
      service.startConversation({ userId: 'user-1', role: 'student' }, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if student classLevel is invalid (e.g. 15)', async () => {
    studentsService.getProfileByUserId.mockResolvedValueOnce({
      classLevel: 15,
    } as any);

    await expect(
      service.startConversation({ userId: 'user-1', role: 'student' }, {}),
    ).rejects.toThrow(BadRequestException);
  });
});
