import { ISubjectRepository } from '../interfaces/IRepositories';
import { Subject } from '../../types';
import { httpClient } from '../../httpClient';

export class ApiSubjectRepository implements ISubjectRepository {
  async getSubjects(classId: string = 'class-8'): Promise<Subject[]> {
    return httpClient.get<Subject[]>(`/curriculum/subjects?classId=${classId}`);
  }

  async getSubjectById(subjectId: string): Promise<Subject | null> {
    return httpClient.get<Subject>(`/curriculum/subjects/${subjectId}`);
  }
}
