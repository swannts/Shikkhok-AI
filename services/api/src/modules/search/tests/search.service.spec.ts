import 'reflect-metadata';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { SearchService } from '../search.service';
import { SearchQueryLogRepository } from '../repositories/search-query-log.repository';
import { StudentsService } from '../../students/students.service';
import { Subject } from '../../curriculum/schemas/subject.schema';
import { Chapter } from '../../curriculum/schemas/chapter.schema';
import { Lesson } from '../../curriculum/schemas/lesson.schema';
import { Textbook } from '../../textbooks/schemas/textbook.schema';
import { PracticeQuestion } from '../../practice/schemas/practice-question.schema';
import { UserRole } from '../../users/enums/user-role.enum';

describe('SearchService', () => {
  let service: SearchService;
  let subjectModel: any;
  let chapterModel: any;
  let lessonModel: any;
  let textbookModel: any;
  let questionModel: any;
  let searchQueryLogRepository: jest.Mocked<SearchQueryLogRepository>;
  let studentsService: jest.Mocked<StudentsService>;

  const studentUser = { userId: new Types.ObjectId().toString(), role: UserRole.STUDENT };

  beforeEach(async () => {
    const createMockModel = () => {
      const fn: any = jest.fn();
      fn.find = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
        exec: jest.fn().mockResolvedValue([]),
      });
      return fn;
    };

    subjectModel = createMockModel();
    chapterModel = createMockModel();
    lessonModel = createMockModel();
    textbookModel = createMockModel();
    questionModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(Subject.name), useValue: subjectModel },
        { provide: getModelToken(Chapter.name), useValue: chapterModel },
        { provide: getModelToken(Lesson.name), useValue: lessonModel },
        { provide: getModelToken(Textbook.name), useValue: textbookModel },
        { provide: getModelToken(PracticeQuestion.name), useValue: questionModel },
        {
          provide: SearchQueryLogRepository,
          useValue: {
            logQuery: jest.fn().mockResolvedValue({} as any),
            getPopularQueries: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: StudentsService,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SearchService);
    searchQueryLogRepository = module.get(SearchQueryLogRepository);
    studentsService = module.get(StudentsService);
  });

  it('should perform unified search across subjects, lessons, and sanitized questions', async () => {
    studentsService.getProfileByUserId.mockResolvedValue({
      classLevel: 8,
      medium: 'bangla',
    } as any);

    const mockSubject = {
      _id: new Types.ObjectId(),
      name: 'Mathematics',
      toJSON: () => ({ name: 'Mathematics' }),
    };

    const mockLesson = {
      _id: new Types.ObjectId(),
      title: 'Algebraic Formulas',
      toJSON: () => ({ title: 'Algebraic Formulas' }),
    };

    const mockQuestion = {
      _id: new Types.ObjectId(),
      prompt: 'Simplify (a+b)^2',
      correctOptionIds: ['option_0'],
      acceptedAnswers: ['a^2+2ab+b^2'],
      answerConfig: { secret: 'hidden' },
      toJSON: () => ({
        prompt: 'Simplify (a+b)^2',
        correctOptionIds: ['option_0'],
        acceptedAnswers: ['a^2+2ab+b^2'],
        answerConfig: { secret: 'hidden' },
      }),
    };

    subjectModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockSubject]),
      }),
      exec: jest.fn().mockResolvedValue([mockSubject]),
    });

    chapterModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
      exec: jest.fn().mockResolvedValue([]),
    });

    lessonModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockLesson]),
      }),
    });

    textbookModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    questionModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockQuestion]),
      }),
    });

    const result = await service.search(studentUser, { q: 'Algebra' });

    expect(result.query).toBe('Algebra');
    expect(result.classLevel).toBe(8);
    expect(result.results.subjects).toHaveLength(1);
    expect(result.results.lessons).toHaveLength(1);
    expect(result.results.practiceQuestions).toHaveLength(1);

    // Verified answers stripped from practice questions
    expect(result.results.practiceQuestions[0].correctOptionIds).toBeUndefined();
    expect(result.results.practiceQuestions[0].acceptedAnswers).toBeUndefined();
    expect(result.results.practiceQuestions[0].answerConfig).toBeUndefined();
  });

  it('should return autocomplete suggestions matching prefix', async () => {
    studentsService.getProfileByUserId.mockResolvedValue({
      classLevel: 8,
      medium: 'bangla',
    } as any);

    subjectModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ name: 'Mathematics' }]),
    });

    chapterModel.find = jest.fn().mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue([{ _id: new Types.ObjectId(), title: 'Algebraic Expressions' }]),
    });

    lessonModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ title: 'Algebraic Formulas' }]),
      }),
    });

    const suggestions = await service.getSuggestions(studentUser, { q: 'Algebra' });
    expect(suggestions).toContain('Algebraic Expressions');
    expect(suggestions).toContain('Algebraic Formulas');
  });

  it('should get popular search queries for grade', async () => {
    searchQueryLogRepository.getPopularQueries.mockResolvedValue([
      { query: 'বীজগণিত', count: 10 },
      { query: 'পরিমাপ', count: 5 },
    ]);

    const popular = await service.getPopular(studentUser, 8);
    expect(popular).toEqual(['বীজগণিত', 'পরিমাপ']);
  });
});
