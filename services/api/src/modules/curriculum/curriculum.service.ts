import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { realpath } from 'node:fs/promises';
import { isAbsolute, resolve, sep, basename } from 'node:path';
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

  async streamLessonPdf(lessonId: string): Promise<StreamableFile> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson || !lesson.isPublished || !lesson.lessonPdfPath) {
      throw new NotFoundException('Lesson PDF not found');
    }

    const configuredRoot = resolve(
      process.env.CURRICULUM_SPLIT_PDF_DIR || '/app/uploads/curriculum/split-books',
    );
    const relativePath = lesson.lessonPdfPath;
    if (isAbsolute(relativePath)) {
      throw new NotFoundException('Lesson PDF not found');
    }
    const candidatePath = resolve(configuredRoot, relativePath);
    if (candidatePath === configuredRoot || !candidatePath.startsWith(`${configuredRoot}${sep}`)) {
      throw new NotFoundException('Lesson PDF not found');
    }
    let filePath: string;
    try {
      const [realRoot, realFile] = await Promise.all([
        realpath(configuredRoot),
        realpath(candidatePath),
      ]);
      if (realFile === realRoot || !realFile.startsWith(`${realRoot}${sep}`)) {
        throw new NotFoundException('Lesson PDF not found');
      }
      filePath = realFile;
    } catch {
      throw new NotFoundException('Lesson PDF is not available yet');
    }

    return new StreamableFile(createReadStream(filePath), {
      type: 'application/pdf',
      disposition: `inline; filename="${basename(filePath)}"`,
    });
  }
}
