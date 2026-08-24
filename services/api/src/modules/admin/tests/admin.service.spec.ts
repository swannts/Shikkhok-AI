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
import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { CurriculumMedium } from '../../curriculum/enums/curriculum-medium.enum';

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
      ],
    }).compile();

    service = module.get(AdminService);
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

  it('should create a new subject in curriculum', async () => {
    const result = await service.createSubject({
      name: 'Class 8 Science',
      slug: 'class-8-science',
      classLevel: 8,
      medium: CurriculumMedium.BANGLA,
      curriculumYear: 2026,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe('Class 8 Science');
  });

  it('should toggle lesson publication status', async () => {
    lessonModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        isPublished: false,
        toJSON: () => ({ isPublished: false }),
      }),
    });

    const result = await service.toggleLessonPublish('lesson-1', false);
    expect(result.isPublished).toBe(false);
  });
});
