import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SyncEvent } from '../schemas/sync-event.schema';
import { SyncEventRepository } from '../repositories/sync-event.repository';

describe('SyncEventRepository', () => {
  let repository: SyncEventRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));
    (MockModel as any).find = mockFind;
    (MockModel as any).findOne = mockFindOne;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncEventRepository,
        { provide: getModelToken(SyncEvent.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(SyncEventRepository);
    model = module.get(getModelToken(SyncEvent.name));
  });

  it('should find by operation id', async () => {
    await repository.findByOperationId('64b8268b6cb348e3b53fa001', 'op-1');
    expect(model.findOne).toHaveBeenCalled();
  });
});
