import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SearchQueryLog, SearchQueryLogDocument } from '../schemas/search-query-log.schema';

@Injectable()
export class SearchQueryLogRepository {
  constructor(
    @InjectModel(SearchQueryLog.name)
    private readonly logModel: Model<SearchQueryLogDocument>,
  ) {}

  async logQuery(data: {
    userId: string;
    query: string;
    classLevel: number;
    medium: string;
    resultCount: number;
  }): Promise<SearchQueryLogDocument> {
    const log = new this.logModel({
      userId: new Types.ObjectId(data.userId),
      query: data.query.trim().toLowerCase(),
      classLevel: data.classLevel,
      medium: data.medium,
      resultCount: data.resultCount,
    });
    return log.save();
  }

  async getPopularQueries(
    classLevel?: number,
    limit = 10,
  ): Promise<{ query: string; count: number }[]> {
    const match: Record<string, any> = {};
    if (classLevel !== undefined) {
      match.classLevel = classLevel;
    }

    const results = await this.logModel.aggregate([
      { $match: match },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]);

    return results;
  }
}
