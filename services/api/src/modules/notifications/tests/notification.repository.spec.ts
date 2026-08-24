import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from '../schemas/notification.schema';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '../enums/notification-type.enum';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockCountDocuments = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));
    (MockModel as any).find = mockFind;
    (MockModel as any).countDocuments = mockCountDocuments;
    (MockModel as any).findOneAndUpdate = mockFindOneAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        { provide: getModelToken(Notification.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(NotificationRepository);
    model = module.get(getModelToken(Notification.name));
  });

  it('should create a notification', async () => {
    const result = await repository.createNotification({
      userId: '64b8268b6cb348e3b53f9001',
      type: NotificationType.SYSTEM,
      title: 'Title',
      body: 'Body',
    });

    expect(result).toBeDefined();
  });
});
