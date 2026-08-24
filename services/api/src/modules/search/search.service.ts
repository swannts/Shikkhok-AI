import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { StudentsService } from '../students/students.service';
import { Subject, SubjectDocument } from '../curriculum/schemas/subject.schema';
import { Chapter, ChapterDocument } from '../curriculum/schemas/chapter.schema';
import { Lesson, LessonDocument } from '../curriculum/schemas/lesson.schema';
import { Textbook, TextbookDocument } from '../textbooks/schemas/textbook.schema';
import {
  PracticeQuestion,
  PracticeQuestionDocument,
} from '../practice/schemas/practice-question.schema';
import { SearchQueryLogRepository } from './repositories/search-query-log.repository';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Subject.name) private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Textbook.name) private readonly textbookModel: Model<TextbookDocument>,
    @InjectModel(PracticeQuestion.name)
    private readonly questionModel: Model<PracticeQuestionDocument>,
    private readonly searchQueryLogRepository: SearchQueryLogRepository,
    private readonly studentsService: StudentsService,
  ) {}

  async search(currentUser: AuthenticatedUser, dto: SearchQueryDto): Promise<Record<string, any>> {
    const classLevel = dto.classLevel ?? (await this.resolveClassLevel(currentUser.userId));
    const medium = dto.medium ?? (await this.resolveMedium(currentUser.userId));
    const limit = Math.max(1, Math.min(dto.limit ?? 10, 50));
    const term = dto.q.trim();

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedTerm, 'i');

    // 1. Search Subjects
    const subjects = await this.subjectModel
      .find({
        classLevel,
        medium,
        isPublished: true,
        name: searchRegex,
      })
      .limit(limit)
      .exec();

    // Get all subject IDs for this grade to constrain chapter/lesson searches
    const allGradeSubjects = await this.subjectModel
      .find({ classLevel, medium, isPublished: true }, { _id: 1 })
      .exec();
    const gradeSubjectIds = allGradeSubjects.map((s) => s._id);

    // 2. Search Chapters
    const chapters = await this.chapterModel
      .find({
        subjectId: { $in: gradeSubjectIds },
        isPublished: true,
        title: searchRegex,
      })
      .limit(limit)
      .exec();

    const chapterIds = chapters.map((c) => c._id);
    const allGradeChapters = await this.chapterModel
      .find({ subjectId: { $in: gradeSubjectIds }, isPublished: true }, { _id: 1 })
      .exec();
    const allGradeChapterIds = allGradeChapters.map((c) => c._id);

    // 3. Search Lessons
    const lessons = await this.lessonModel
      .find({
        chapterId: { $in: allGradeChapterIds },
        isPublished: true,
        title: searchRegex,
      })
      .limit(limit)
      .exec();

    // 4. Search Textbooks
    const textbooks = await this.textbookModel
      .find({
        classLevel,
        medium,
        isPublished: true,
        $or: [{ title: searchRegex }, { titleBn: searchRegex }],
      })
      .limit(limit)
      .exec();

    // 5. Search Practice Questions (sanitized, no answers/explanations exposed)
    const questions = await this.questionModel
      .find({
        isPublished: true,
        $or: [{ prompt: searchRegex }, { tags: searchRegex }],
      })
      .limit(limit)
      .exec();

    const sanitizedQuestions = questions.map((q) => {
      const json = q.toJSON();
      delete json.correctOptionIds;
      delete json.acceptedAnswers;
      delete json.answerConfig;
      return json;
    });

    const totalResults =
      subjects.length +
      chapters.length +
      lessons.length +
      textbooks.length +
      sanitizedQuestions.length;

    // Log query in background
    void this.searchQueryLogRepository.logQuery({
      userId: currentUser.userId,
      query: term,
      classLevel,
      medium,
      resultCount: totalResults,
    });

    return {
      query: term,
      classLevel,
      medium,
      totalResults,
      results: {
        subjects: subjects.map((s) => s.toJSON()),
        chapters: chapters.map((c) => c.toJSON()),
        lessons: lessons.map((l) => l.toJSON()),
        textbooks: textbooks.map((t) => t.toJSON()),
        practiceQuestions: sanitizedQuestions,
      },
    };
  }

  async getSuggestions(
    currentUser: AuthenticatedUser,
    dto: SearchSuggestionsQueryDto,
  ): Promise<string[]> {
    const classLevel = dto.classLevel ?? (await this.resolveClassLevel(currentUser.userId));
    const medium = await this.resolveMedium(currentUser.userId);
    const limit = Math.max(1, Math.min(dto.limit ?? 5, 20));
    const term = dto.q.trim();

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedTerm, 'i');

    const gradeSubjects = await this.subjectModel
      .find({ classLevel, medium, isPublished: true }, { _id: 1, name: 1 })
      .exec();
    const gradeSubjectIds = gradeSubjects.map((s) => s._id);

    const gradeChapters = await this.chapterModel
      .find(
        {
          subjectId: { $in: gradeSubjectIds },
          isPublished: true,
        },
        { _id: 1, title: 1 },
      )
      .exec();
    const gradeChapterIds = gradeChapters.map((c) => c._id);

    const matchingLessons = await this.lessonModel
      .find(
        {
          chapterId: { $in: gradeChapterIds },
          isPublished: true,
          title: searchRegex,
        },
        { title: 1 },
      )
      .limit(limit)
      .exec();

    const suggestions = new Set<string>();

    for (const sub of gradeSubjects) {
      if (sub.name && searchRegex.test(sub.name)) suggestions.add(sub.name);
    }

    for (const ch of gradeChapters) {
      if (ch.title && searchRegex.test(ch.title)) suggestions.add(ch.title);
    }

    for (const l of matchingLessons) {
      if (l.title && searchRegex.test(l.title)) suggestions.add(l.title);
    }

    return Array.from(suggestions).slice(0, limit);
  }

  async getPopular(currentUser: AuthenticatedUser, classLevel?: number): Promise<string[]> {
    const targetClassLevel = classLevel ?? (await this.resolveClassLevel(currentUser.userId));
    const popular = await this.searchQueryLogRepository.getPopularQueries(targetClassLevel, 10);
    return popular.map((p) => p.query);
  }

  private async resolveClassLevel(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.classLevel ?? 8;
    } catch {
      return 8;
    }
  }

  private async resolveMedium(userId: string): Promise<string> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.medium ?? 'bangla';
    } catch {
      return 'bangla';
    }
  }
}
