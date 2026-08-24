import { Injectable, NotFoundException } from '@nestjs/common';
import { CurriculumQueryDto } from './dto/curriculum-query.dto';
import { SubjectRepository } from './repositories/subject.repository';
import { ChapterRepository } from './repositories/chapter.repository';
import { LessonRepository } from './repositories/lesson.repository';

@Injectable()
export class CurriculumService {
  constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly lessonRepository: LessonRepository,
  ) {}

  async listSubjects(query: CurriculumQueryDto): Promise<Record<string, any>[]> {
    const subjects = await this.subjectRepository.findPublishedByFilter(query);
    return subjects.map((subject) => subject.toJSON());
  }

  async getSubject(subjectId: string): Promise<Record<string, any>> {
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject.toJSON();
  }

  async listChapters(subjectId: string): Promise<Record<string, any>[]> {
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const chapters = await this.chapterRepository.findPublishedBySubjectId(subjectId);
    return chapters.map((chapter) => chapter.toJSON());
  }

  async getChapter(chapterId: string): Promise<Record<string, any>> {
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter.toJSON();
  }

  async listLessons(chapterId: string): Promise<Record<string, any>[]> {
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const lessons = await this.lessonRepository.findPublishedByChapterId(chapterId);
    return lessons.map((lesson) => lesson.toJSON());
  }

  async getLesson(lessonId: string): Promise<Record<string, any>> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson.toJSON();
  }
}
