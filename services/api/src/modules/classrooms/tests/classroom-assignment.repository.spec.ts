import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClassroomAssignmentRepository } from '../repositories/classroom-assignment.repository';
import { ClassroomAssignment } from '../schemas/classroom-assignment.schema';
import { AssignmentType } from '../enums/assignment-type.enum';

describe('ClassroomAssignmentRepository', () => {
  let repository: ClassroomAssignmentRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.findById = jest.fn();
    model.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomAssignmentRepository,
        {
          provide: getModelToken(ClassroomAssignment.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(ClassroomAssignmentRepository);
  });

  it('should create a classroom assignment', async () => {
    const result = await repository.createAssignment({
      classroomId: new Types.ObjectId(),
      teacherId: new Types.ObjectId(),
      title: 'Chapter 3 Homework',
      assignmentType: AssignmentType.HOMEWORK,
      dueDate: new Date(),
      maxScore: 100,
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Chapter 3 Homework');
  });
});
