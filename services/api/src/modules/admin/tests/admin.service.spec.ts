import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AdminService } from '../admin.service';
import { AdminAuditService } from '../admin-audit.service';
import { User } from '../../users/schemas/user.schema';
import { Subject } from '../../curriculum/schemas/subject.schema';
import { Chapter } from '../../curriculum/schemas/chapter.schema';
import { Lesson } from '../../curriculum/schemas/lesson.schema';
import { ExamSession } from '../../exams/schemas/exam-session.schema';
import { HomeworkSubmission } from '../../homework/schemas/homework-submission.schema';
import { StudentSubscription } from '../../subscriptions/schemas/student-subscription.schema';
import { PaymentTransaction } from '../../subscriptions/schemas/payment-transaction.schema';
import { PaymentTransactionRepository } from '../../subscriptions/repositories/payment-transaction.repository';
import { SubscriptionActivationService } from '../../subscriptions/services/subscription-activation.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { CurriculumMedium } from '../../curriculum/enums/curriculum-medium.enum';
import { PaymentStatus } from '../../subscriptions/enums/payment-status.enum';

describe('AdminService', () => {
  let service: AdminService;
  let userModel: any;
  let subjectModel: any;
  let chapterModel: any;
  let lessonModel: any;
  let examSessionModel: any;
  let homeworkSubmissionModel: any;
  let subscriptionModel: any;
  let transactionModel: any;
  let transactionRepository: jest.Mocked<PaymentTransactionRepository>;
  let activationService: jest.Mocked<SubscriptionActivationService>;
  let auditService: jest.Mocked<AdminAuditService>;

  beforeEach(async () => {
    const createMockModel = () => {
      const fn: any = jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          ...dto,
          toJSON: () => ({ _id: new Types.ObjectId(), ...dto }),
        }),
      }));
      fn.countDocuments = jest.fn().mockResolvedValue(10);
      fn.aggregate = jest.fn().mockResolvedValue([]);
      fn.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      fn.findById = jest.fn();
      fn.findByIdAndUpdate = jest.fn();
      return fn;
    };

    userModel = createMockModel();
    subjectModel = createMockModel();
    chapterModel = createMockModel();
    lessonModel = createMockModel();
    examSessionModel = createMockModel();
    homeworkSubmissionModel = createMockModel();
    subscriptionModel = createMockModel();
    transactionModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Subject.name), useValue: subjectModel },
        { provide: getModelToken(Chapter.name), useValue: chapterModel },
        { provide: getModelToken(Lesson.name), useValue: lessonModel },
        { provide: getModelToken(ExamSession.name), useValue: examSessionModel },
        { provide: getModelToken(HomeworkSubmission.name), useValue: homeworkSubmissionModel },
        { provide: getModelToken(StudentSubscription.name), useValue: subscriptionModel },
        { provide: getModelToken(PaymentTransaction.name), useValue: transactionModel },
        {
          provide: PaymentTransactionRepository,
          useValue: {
            findPendingManualPayments: jest.fn(),
          },
        },
        {
          provide: SubscriptionActivationService,
          useValue: {
            activateFromPayment: jest.fn(),
            rejectPayment: jest.fn(),
          },
        },
        {
          provide: AdminAuditService,
          useValue: {
            recordAudit: jest.fn().mockResolvedValue(undefined),
            listAuditLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminService);
    transactionRepository = module.get(PaymentTransactionRepository);
    activationService = module.get(SubscriptionActivationService);
    auditService = module.get(AdminAuditService);
  });

  it('should return metrics overview with users and revenue', async () => {
    userModel.countDocuments.mockResolvedValue(100);
    userModel.aggregate.mockResolvedValue([
      { _id: UserRole.STUDENT, count: 80 },
      { _id: UserRole.TEACHER, count: 10 },
      { _id: UserRole.PARENT, count: 10 },
    ]);
    transactionModel.aggregate.mockResolvedValue([{ totalRevenueBdt: 15000 }]);

    const metrics = await service.getMetricsOverview();
    expect(metrics.users.total).toBe(100);
    expect(metrics.users.byRole[UserRole.STUDENT]).toBe(80);
    expect(metrics.commercial.totalRevenueBdt).toBe(15000);
  });

  it('should prevent admin from suspending or deleting their own account (Self-Protection)', async () => {
    await expect(
      service.updateUserStatus('admin-user-id', 'admin-user-id', {
        status: UserStatus.SUSPENDED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update user status and record audit log when updating another user', async () => {
    userModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        status: UserStatus.ACTIVE,
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          status: UserStatus.SUSPENDED,
          toJSON: () => ({ status: UserStatus.SUSPENDED }),
        }),
      }),
    });

    const result = await service.updateUserStatus('admin-1', 'user-target-2', {
      status: UserStatus.SUSPENDED,
      reason: 'Repeated policy violations',
    });

    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'UPDATE_USER_STATUS',
        resourceId: 'user-target-2',
      }),
    );
  });

  it('should create a new subject in curriculum and record audit', async () => {
    const result = await service.createSubject('admin-1', {
      name: 'Class 8 Science',
      slug: 'class-8-science',
      classLevel: 8,
      medium: CurriculumMedium.BANGLA,
      curriculumYear: 2026,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe('Class 8 Science');
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'CREATE_SUBJECT',
      }),
    );
  });

  it('should approve manual payment and record audit', async () => {
    activationService.activateFromPayment.mockResolvedValue({
      isAlreadyActive: false,
      subscription: { _id: new Types.ObjectId(), toJSON: () => ({ tier: 'premium' }) } as any,
      transaction: { transactionId: 'MANUAL_123', toJSON: () => ({ status: 'completed' }) } as any,
    });

    const result = await service.approvePayment(
      'admin-1',
      'MANUAL_123',
      'Verified against bKash statement',
    );
    expect(result.message).toContain('Payment approved');
    expect(activationService.activateFromPayment).toHaveBeenCalledWith(
      'MANUAL_123',
      'admin:admin-1',
      undefined,
      'Verified against bKash statement',
    );
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'APPROVE_PAYMENT',
        resourceId: 'MANUAL_123',
      }),
    );
  });

  it('should reject manual payment and record audit', async () => {
    activationService.rejectPayment.mockResolvedValue({
      transactionId: 'MANUAL_123',
      status: PaymentStatus.FAILED,
      toJSON: () => ({ transactionId: 'MANUAL_123', status: 'failed' }),
    } as any);

    const result = await service.rejectPayment(
      'admin-1',
      'MANUAL_123',
      'TrxID does not match bank',
    );
    expect(result.message).toContain('Payment rejected');
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'REJECT_PAYMENT',
        resourceId: 'MANUAL_123',
      }),
    );
  });

  it('should list pending manual payments via transaction repository', async () => {
    transactionRepository.findPendingManualPayments.mockResolvedValue([
      {
        transactionId: 'MANUAL_100',
        status: PaymentStatus.PENDING_VERIFICATION,
        toJSON: () => ({ transactionId: 'MANUAL_100' }),
      } as any,
    ]);

    const result = await service.listPendingPayments(10, 1);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].transactionId).toBe('MANUAL_100');
  });
});
