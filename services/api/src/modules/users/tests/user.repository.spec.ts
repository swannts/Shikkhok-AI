import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRepository } from '../repositories/user.repository';
import { User, UserDocument } from '../schemas/user.schema';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

describe('UserRepository', () => {
  let repository: UserRepository;
  let userModel: any;

  beforeEach(async () => {
    // Create a fake Mongoose model with chainable exec()
    const mockExec = jest.fn();
    const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindById = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindByIdAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    // Mock constructor + save
    const MockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));

    (MockModel as any).findOne = mockFindOne;
    (MockModel as any).findById = mockFindById;
    (MockModel as any).findByIdAndUpdate = mockFindByIdAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken(User.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    userModel = module.get(getModelToken(User.name));
  });

  describe('createUser', () => {
    it('should create and save a new user document', async () => {
      const userData = {
        name: 'রাহুল আহমেদ',
        email: 'rahul@example.com',
        phone: '01712345678',
        passwordHash: 'hashed_password',
        role: UserRole.STUDENT,
      };

      const result = await repository.createUser(userData);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe('রাহুল আহমেদ');
      expect(result.email).toBe('rahul@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should query with lowercase trimmed email', async () => {
      const mockUser = {
        _id: new Types.ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.STUDENT,
      };

      userModel.findOne().exec.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('  Test@Example.COM  ');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      userModel.findOne().exec.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByPhone', () => {
    it('should normalize 01x format to +880 before querying', async () => {
      userModel.findOne().exec.mockResolvedValue(null);

      await repository.findByPhone('01712345678');

      expect(userModel.findOne).toHaveBeenCalledWith({
        phone: '+8801712345678',
      });
    });

    it('should normalize 880 format to +880 before querying', async () => {
      userModel.findOne().exec.mockResolvedValue(null);

      await repository.findByPhone('8801712345678');

      expect(userModel.findOne).toHaveBeenCalledWith({
        phone: '+8801712345678',
      });
    });
  });

  describe('updateStatus', () => {
    it('should update user status by ID', async () => {
      const userId = new Types.ObjectId().toString();
      userModel.findByIdAndUpdate().exec.mockResolvedValue({
        _id: userId,
        status: UserStatus.SUSPENDED,
      });

      const result = await repository.updateStatus(userId, UserStatus.SUSPENDED);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { status: UserStatus.SUSPENDED },
        { new: true },
      );
    });
  });
});
