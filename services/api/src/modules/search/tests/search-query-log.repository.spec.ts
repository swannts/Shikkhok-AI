import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { SearchQueryLogRepository } from '../repositories/search-query-log.repository';
import { SearchQueryLog } from '../schemas/search-query-log.schema';

describe('SearchQueryLogRepository', () => {
  let repository: SearchQueryLogRepository;
  let model: any;

  beforeEach(async () => {
    model = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));
    model.aggregate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchQueryLogRepository,
        {
          provide: getModelToken(SearchQueryLog.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(SearchQueryLogRepository);
  });

  it('should log a search query', async () => {
    const result = await repository.logQuery({
      userId: new Types.ObjectId().toString(),
      query: 'বীজগণিত',
      classLevel: 8,
      medium: 'bangla',
      resultCount: 5,
    });

    expect(result).toBeDefined();
    expect(result.query).toBe('বীজগণিত');
  });

  it('should get popular queries aggregated by search count', async () => {
    model.aggregate.mockResolvedValue([
      { query: 'বীজগণিত', count: 42 },
      { query: 'পরিমাপ', count: 18 },
    ]);

    const popular = await repository.getPopularQueries(8, 10);
    expect(popular).toHaveLength(2);
    expect(popular[0].query).toBe('বীজগণিত');
    expect(popular[0].count).toBe(42);
  });
});
