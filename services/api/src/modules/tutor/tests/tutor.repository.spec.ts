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
    const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
    const mockSort = jest.fn().mockReturnValue({ limit: mockLimit, exec: mockExec });
    const mockFind = jest.fn().mockReturnValue({
      sort: mockSort,
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

  it('should query conversations with cursor filter and limit', async () => {
    const userId = '507f1f77bcf86cd799439011';
    model.find().sort().limit().exec.mockResolvedValue([
      { _id: 'conv-1' },
    ]);

    const result = await repository.findByUserIdCursor(userId, 10, {
      updatedAt: '2026-10-28T02:00:00.000Z',
      id: '507f1f77bcf86cd799439012',
    });

    expect(result).toBeDefined();
    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.anything(),
        $or: expect.any(Array),
      }),
    );
  });
});
