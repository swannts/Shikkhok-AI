import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TutorConversation } from '../schemas/tutor-conversation.schema';
import { TutorConversationRepository } from '../repositories/tutor-conversation.repository';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';

describe('TutorConversationRepository', () => {
  let repository: TutorConversationRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockFindById = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindByIdAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));
    (MockModel as any).find = mockFind;
    (MockModel as any).findById = mockFindById;
    (MockModel as any).findByIdAndUpdate = mockFindByIdAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorConversationRepository,
        { provide: getModelToken(TutorConversation.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(TutorConversationRepository);
    model = module.get(getModelToken(TutorConversation.name));
  });

  it('should append a tutor message', async () => {
    model.findByIdAndUpdate().exec.mockResolvedValue({
      _id: 'conv-1',
    });

    const result = await repository.appendMessage('conv-1', {
      role: TutorMessageRole.USER,
      content: 'Hello',
    });

    expect(result).toBeDefined();
  });
});
