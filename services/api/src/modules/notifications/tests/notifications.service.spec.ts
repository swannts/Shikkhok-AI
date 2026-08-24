import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { NotificationType } from '../enums/notification-type.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepository,
          useValue: {
            createNotification: jest.fn(),
            findByUserId: jest.fn(),
            findPageByUserId: jest.fn(),
            countUnreadByUserId: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    repo = module.get(NotificationRepository);
    usersService = module.get(UsersService);
  });

  it('should list notifications', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.findPageByUserId.mockResolvedValue([
      {
        toJSON: jest
          .fn()
          .mockReturnValue({ title: 'Hello', createdAt: '2026-08-24T00:00:00.000Z', _id: 'n1' }),
      },
    ] as any);

    await expect(
      service.getMyNotifications({ userId: 'user-1', role: UserRole.STUDENT }),
    ).resolves.toEqual({
      data: [{ title: 'Hello', createdAt: '2026-08-24T00:00:00.000Z', _id: 'n1' }],
      meta: {
        nextCursor: null,
        hasNext: false,
      },
    });
  });

  it('should throw when marking missing notification as read', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);
    repo.markAsRead.mockResolvedValue(null);

    await expect(
      service.markMyNotificationAsRead({ userId: 'user-1', role: UserRole.STUDENT }, 'missing'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create a notification', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.ADMIN } as any);
    repo.createNotification.mockResolvedValue({
      toJSON: jest.fn().mockReturnValue({ type: NotificationType.SYSTEM }),
    } as any);

    const result = await service.createNotificationForCurrentUser(
      { userId: 'user-1', role: UserRole.ADMIN },
      { type: NotificationType.SYSTEM, title: 'Hi', body: 'Body' },
    );

    expect(result.type).toBe(NotificationType.SYSTEM);
  });

  it('should reject self notification creation for non-admin users', async () => {
    usersService.findById.mockResolvedValue({ role: UserRole.STUDENT } as any);

    await expect(
      service.createNotificationForCurrentUser(
        { userId: 'user-1', role: UserRole.STUDENT },
        { type: NotificationType.SYSTEM, title: 'Hi', body: 'Body' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
