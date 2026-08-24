import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AdminService } from '../admin.service';
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
      ],
    }).compile();

    service = module.get(AdminService);
    transactionRepository = module.get(PaymentTransactionRepository);
    activationService = module.get(SubscriptionActivationService);
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

  it('should paginate and filter users list', async () => {
    userModel
      .find()
      .sort()
      .skip()
      .limit()
      .exec.mockResolvedValue([
        { name: 'Rahim', role: UserRole.STUDENT, toJSON: () => ({ name: 'Rahim' }) },
      ]);
    userModel.countDocuments.mockResolvedValue(1);

    const result = await service.listUsers({ page: 1, limit: 20 });
    expect(result.users).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('should update user status', async () => {
    userModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        status: UserStatus.SUSPENDED,
        toJSON: () => ({ status: UserStatus.SUSPENDED }),
      }),
    });

    const result = await service.updateUserStatus('user-1', {
      status: UserStatus.SUSPENDED,
    });
    expect(result.status).toBe(UserStatus.SUSPENDED);
  });

  it('should list pending manual MFS payments', async () => {
    transactionRepository.findPendingManualPayments.mockResolvedValue([
      {
        transactionId: 'MANUAL_123',
        status: PaymentStatus.PENDING_VERIFICATION,
        toJSON: () => ({ transactionId: 'MANUAL_123' }),
      } as any,
    ]);

    const result = await service.listPendingPayments(20, 1);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].transactionId).toBe('MANUAL_123');
  });

  it('should approve manual payment and activate subscription', async () => {
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
  });

  it('should reject manual payment and mark failed', async () => {
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
    expect(activationService.rejectPayment).toHaveBeenCalledWith(
      'MANUAL_123',
      'admin:admin-1',
      'TrxID does not match bank',
    );
  });
});
