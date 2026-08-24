import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TextbookManifestRepository } from '../repositories/textbook-manifest.repository';
import { TextbookManifest } from '../schemas/textbook-manifest.schema';
import { ManifestStatus } from '../enums/manifest-status.enum';

describe('TextbookManifestRepository', () => {
  let repository: TextbookManifestRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.findOne = jest.fn();
    model.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextbookManifestRepository,
        {
          provide: getModelToken(TextbookManifest.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(TextbookManifestRepository);
  });

  it('should find latest ready manifest by textbookId', async () => {
    const textbookId = new Types.ObjectId().toString();
    const mockExec = jest.fn().mockResolvedValue({
      textbookId: new Types.ObjectId(textbookId),
      version: '1.0.0',
      status: ManifestStatus.READY,
    });
    const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
    model.findOne.mockReturnValue({ sort: mockSort });

    const result = await repository.findLatestByTextbookId(textbookId);
    expect(result).toBeDefined();
    expect(result?.version).toBe('1.0.0');
  });
});
