import { curriculumRepository } from './curriculum.repository';

export class CurriculumService {
  async getSubjects(classId: string) {
    return curriculumRepository.getSubjects(classId);
  }

  async getChapters(subjectId: string) {
    return curriculumRepository.getChaptersBySubject(subjectId);
  }
}

export const curriculumService = new CurriculumService();
