import { IChapterRepository } from '../interfaces/IRepositories';
import { Chapter } from '../../types';
import { httpClient } from '../../httpClient';

export class ApiChapterRepository implements IChapterRepository {
  async getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    return httpClient.get<Chapter[]>(`/curriculum/subjects/${subjectId}/chapters`);
  }

  async getChapterById(chapterId: string): Promise<Chapter | null> {
    return httpClient.get<Chapter>(`/curriculum/chapters/${chapterId}`);
  }
}
