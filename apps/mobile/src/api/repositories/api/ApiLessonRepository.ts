import { ILessonRepository } from '../interfaces/IRepositories';
import { Lesson } from '../../types';
import { httpClient } from '../../httpClient';

export class ApiLessonRepository implements ILessonRepository {
  async getLessonById(lessonId: string): Promise<Lesson> {
    return httpClient.get<Lesson>(`/curriculum/lessons/${lessonId}`);
  }
}
