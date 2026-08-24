import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ParentProfile } from '../schemas/parent-profile.schema';
import { ParentProfileRepository } from '../repositories/parent-profile.repository';

describe('ParentProfileRepository', () => {
  let repository: ParentProfileRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation(() => ({}));
    (MockModel as any).findOne = mockFindOne;
    (MockModel as any).findOneAndUpdate = mockFindOneAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentProfileRepository,
        { provide: getModelToken(ParentProfile.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(ParentProfileRepository);
    model = module.get(getModelToken(ParentProfile.name));
  });

  it('should upsert a parent profile', async () => {
    const profile = { toJSON: jest.fn().mockReturnValue({ displayName: 'Parent' }) };
    model.findOneAndUpdate().exec.mockResolvedValue(profile);

    const result = await repository.upsertProfile('parent-1', { displayName: 'Parent' });

    expect(result).toEqual(profile);
  });

  it('should add linked student without duplicates', async () => {
    const profile = { toJSON: jest.fn().mockReturnValue({ linkedStudentIds: ['child-1'] }) };
    model.findOneAndUpdate().exec.mockResolvedValue(profile);

    const result = await repository.addLinkedStudent('parent-1', new Types.ObjectId().toString());

    expect(result).toEqual(profile);
  });
});
