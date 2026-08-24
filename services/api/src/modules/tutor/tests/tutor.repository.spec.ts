import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TutorConversation } from '../schemas/tutor-conversation.schema';
import { TutorConversationRepository } from '../repositories/tutor-conversation.repository';

describe('TutorConversationRepository', () => {
  let repository: TutorConversationRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockFindById = jest.fn().mockReturnValue({ exec: mockExec });
    const MockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));
    (MockModel as any).find = mockFind;
    (MockModel as any).findById = mockFindById;
    (MockModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorConversationRepository,
        { provide: getModelToken(TutorConversation.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(TutorConversationRepository);
    model = module.get(getModelToken(TutorConversation.name));
  });

  it('should touch a tutor conversation', async () => {
    model.findByIdAndUpdate().exec.mockResolvedValue({
      _id: 'conv-1',
    });

    const result = await repository.touchConversation('conv-1', 2);

    expect(result).toBeDefined();
  });
});
