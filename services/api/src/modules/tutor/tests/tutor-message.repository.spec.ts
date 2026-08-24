import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TutorMessage } from '../schemas/tutor-message.schema';
import { TutorMessageRepository } from '../repositories/tutor-message.repository';
import { TutorMessageRole } from '../enums/tutor-message-role.enum';

describe('TutorMessageRepository', () => {
  let repository: TutorMessageRepository;
  let model: any;
  const conversationId = new Types.ObjectId().toHexString();
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ exec: mockExec }),
      }),
    });
    const MockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));
    (MockModel as any).find = mockFind;
    (MockModel as any).countDocuments = jest.fn().mockReturnValue({ exec: mockExec });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorMessageRepository,
        { provide: getModelToken(TutorMessage.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(TutorMessageRepository);
    model = module.get(getModelToken(TutorMessage.name));
  });

  it('should create a tutor message', async () => {
    await repository.createMessage({
      conversationId,
      userId,
      role: TutorMessageRole.USER,
      content: 'Hello',
    });

    expect(model).toHaveBeenCalled();
  });

  it('should build a cursor-paginated query', async () => {
    await repository.findByConversationCursor(conversationId, 20, {
      createdAt: '2026-08-24T00:00:00.000Z',
      id: new Types.ObjectId().toHexString(),
    });

    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: expect.any(Object),
        $or: expect.any(Array),
      }),
    );
  });
});
