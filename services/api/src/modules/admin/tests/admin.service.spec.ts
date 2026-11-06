import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AdminService } from '../admin.service';
import { Textbook } from '../../textbooks/schemas/textbook.schema';
import { RabbitMqService } from '../../../core/queue/rabbitmq.service';
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
import { ContentWorkflowStatus } from '../../curriculum/enums/content-workflow-status.enum';
import { AuthService } from '../../auth/auth.service';
import { PaymentStateMachineService } from '../../subscriptions/services/payment-state-machine.service';

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
  let textbookModel: any;
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
        lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
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
      fn.findOne = jest.fn();
      fn.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      });
      fn.updateMany = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
      fn.updateOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
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
    textbookModel = createMockModel();

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
        { provide: getModelToken(Textbook.name), useValue: textbookModel },
        { provide: RabbitMqService, useValue: { publish: jest.fn(), stats: jest.fn(), listFailed: jest.fn(), retryFailed: jest.fn() } },
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
        {
          provide: AuthService,
          useValue: {
            getActiveSessionCount: jest.fn().mockResolvedValue(2),
            logoutAll: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PaymentStateMachineService,
          useValue: {
            validateTransition: jest.fn(),
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

  it('should transition a lesson through the review workflow and audit it', async () => {
    const lesson: any = {
      workflowStatus: ContentWorkflowStatus.DRAFT,
      isPublished: false,
      save: jest.fn().mockImplementation(async function () {
        return this;
      }),
      toJSON: jest.fn().mockReturnValue({ workflowStatus: ContentWorkflowStatus.IN_REVIEW }),
    };
    lessonModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(lesson) });

    const result = await service.transitionLessonWorkflow(
      new Types.ObjectId().toString(),
      new Types.ObjectId().toString(),
      ContentWorkflowStatus.IN_REVIEW,
      'Please verify page references',
    );

    expect(result.workflowStatus).toBe(ContentWorkflowStatus.IN_REVIEW);
    expect(lesson.reviewComments).toBe('Please verify page references');
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TRANSITION_LESSON_WORKFLOW' }),
    );
  });

  it('creates new lessons as unpublished drafts regardless of requested publish flag', async () => {
    const savedJson = {
      workflowStatus: ContentWorkflowStatus.DRAFT,
      isPublished: false,
    };
    lessonModel.mockImplementation((data) => ({
      ...data,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: new Types.ObjectId(),
        toJSON: () => savedJson,
      }),
    }));

    await service.createLesson(new Types.ObjectId().toString(), {
      chapterId: new Types.ObjectId().toString(),
      title: 'Draft lesson',
      slug: 'draft-lesson',
      isPublished: true,
      contentBlocks: [],
    } as any);

    expect(lessonModel).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublished: false,
        workflowStatus: ContentWorkflowStatus.DRAFT,
      }),
    );
  });

  it('does not publish a lesson until it has been approved', async () => {
    lessonModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        workflowStatus: ContentWorkflowStatus.DRAFT,
        isPublished: false,
      }),
    });

    await expect(
      service.toggleLessonPublish(
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        true,
      ),
    ).rejects.toThrow('A lesson must be approved before it can be published');
  });

  it('stores extracted textbook lessons as drafts requiring teacher review', async () => {
    const subjectId = new Types.ObjectId();
    const bookId = new Types.ObjectId().toString();
    textbookModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ subjectId }),
    });
    const chapterId = new Types.ObjectId();
    chapterModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: chapterId }),
    });
    chapterModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: chapterId }]),
        }),
      }),
    });
    chapterModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });
    lessonModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });
    textbookModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    lessonModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    const result = await service.persistExtractedStructure(bookId, [
      {
        chapter_title: 'Numbers',
        lesson_title: 'Place value',
        page_start: 4,
        page_end: 5,
        text: 'A lesson extracted from the source PDF.',
      },
    ]);

    expect(result).toEqual({ ok: true, chapters: 1, lessons: 1 });
    expect(lessonModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.objectContaining({
          isPublished: false,
          workflowStatus: ContentWorkflowStatus.DRAFT,
          publishedAt: null,
        }),
        $setOnInsert: expect.objectContaining({
          workflowHistory: [
            expect.objectContaining({
              toStatus: ContentWorkflowStatus.DRAFT,
              actorUserId: null,
            }),
          ],
        }),
      }),
      expect.objectContaining({ upsert: true }),
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

  it('should return platform health overview with service statuses', async () => {
    const health = await service.getPlatformHealthOverview();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('services');
    expect(health.services).toHaveProperty('mongodb');
    expect(health.services).toHaveProperty('redis');
    expect(health.services).toHaveProperty('aiService');
    expect(health.services).toHaveProperty('queues');
  });

  it('should return queue metrics overview with queue counts', async () => {
    const queueMetrics = await service.getQueueMetricsOverview();
    expect(queueMetrics).toHaveProperty('queues');
    expect(queueMetrics).toHaveProperty('deadLetterQueues');
    expect(queueMetrics).toHaveProperty('totalBacklog');
    expect(queueMetrics.queues).toHaveProperty('curriculum');
    expect(queueMetrics.queues).toHaveProperty('notifications');
  });

  it('should revoke all active user sessions and record audit', async () => {
    userModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: 'target-user-123',
        role: UserRole.STUDENT,
      }),
    });

    const result = await service.revokeUserSessions('admin-actor', 'target-user-123');
    expect(result.message).toContain('revoked');
    expect(result.revokedSessions).toBe(2);
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-actor',
        action: 'REVOKE_USER_SESSIONS',
        resourceId: 'target-user-123',
      }),
    );
  });

  it('should refund a payment and record audit', async () => {
    const mockSave = jest.fn().mockResolvedValue({
      transactionId: 'TRX_PAID_999',
      status: PaymentStatus.REFUNDED,
      toJSON: () => ({ transactionId: 'TRX_PAID_999', status: PaymentStatus.REFUNDED }),
    });

    transactionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        transactionId: 'TRX_PAID_999',
        userId: new Types.ObjectId(),
        planId: new Types.ObjectId(),
        status: PaymentStatus.COMPLETED,
        amountBdt: 450,
        paymentMethod: 'bkash',
        save: mockSave,
      }),
    });

    subscriptionModel.updateMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    const result = await service.refundPayment(
      'admin-actor',
      'TRX_PAID_999',
      'Accidental duplicate charge',
    );
    expect(result.message).toContain('refunded successfully');
    expect(mockSave).toHaveBeenCalled();
    expect(auditService.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-actor',
        action: 'REFUND_PAYMENT',
        resourceId: 'TRX_PAID_999',
      }),
    );
  });

  it('should generate payment reconciliation breakdown and flag discrepancies', async () => {
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                transactionId: 'TRX_STALE_1',
                status: PaymentStatus.PENDING_VERIFICATION,
                amountBdt: 500,
                createdAt: new Date(Date.now() - 72 * 3600 * 1000), // 3 days ago
              },
            ]),
          }),
        }),
      }),
    });

    transactionModel.aggregate
      .mockResolvedValueOnce([
        { _id: PaymentStatus.COMPLETED, count: 10, totalAmountBdt: 5000 },
        { _id: PaymentStatus.REFUNDED, count: 1, totalAmountBdt: 500 },
      ])
      .mockResolvedValueOnce([
        { _id: 'bkash', count: 8, totalAmountBdt: 4000 },
        { _id: 'nagad', count: 3, totalAmountBdt: 1500 },
      ]);

    const result = await service.getPaymentReconciliation({});
    expect(result.totalGrossRevenue).toBe(5000);
    expect(result.totalRefundedAmount).toBe(500);
    expect(result.netRevenue).toBe(4500);
    expect(result.discrepancyCount).toBe(1);
    expect(result.discrepancies[0].type).toBe('STALE_PENDING_VERIFICATION');
  });
});
