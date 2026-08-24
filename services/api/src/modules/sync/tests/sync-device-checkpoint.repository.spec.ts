import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SyncDeviceCheckpoint } from '../schemas/sync-device-checkpoint.schema';
import { SyncDeviceCheckpointRepository } from '../repositories/sync-device-checkpoint.repository';

describe('SyncDeviceCheckpointRepository', () => {
  let repository: SyncDeviceCheckpointRepository;
  let model: any;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

    const MockModel = jest.fn();
    (MockModel as any).findOne = mockFindOne;
    (MockModel as any).findOneAndUpdate = mockFindOneAndUpdate;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncDeviceCheckpointRepository,
        { provide: getModelToken(SyncDeviceCheckpoint.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get(SyncDeviceCheckpointRepository);
    model = module.get(getModelToken(SyncDeviceCheckpoint.name));
  });

  it('should upsert a checkpoint', async () => {
    await repository.upsertCheckpoint({
      userId: '64b8268b6cb348e3b53fa001',
      deviceId: 'device-1',
      lastSyncedAt: new Date(),
      lastBatchSize: 1,
      lastStatus: 'applied',
    });

    expect(model.findOneAndUpdate).toHaveBeenCalled();
  });
});
