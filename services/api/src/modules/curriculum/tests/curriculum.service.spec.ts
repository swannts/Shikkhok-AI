import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CurriculumService } from '../curriculum.service';
import { SubjectRepository } from '../repositories/subject.repository';
import { ChapterRepository } from '../repositories/chapter.repository';
import { LessonRepository } from '../repositories/lesson.repository';
import { CurriculumMedium } from '../enums/curriculum-medium.enum';

describe('CurriculumService', () => {
  let service: CurriculumService;
  let subjectRepository: jest.Mocked<SubjectRepository>;
  let chapterRepository: jest.Mocked<ChapterRepository>;
  let lessonRepository: jest.Mocked<LessonRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurriculumService,
        {
          provide: SubjectRepository,
          useValue: {
            findPublishedByFilter: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: ChapterRepository,
          useValue: {
            findPublishedBySubjectId: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: LessonRepository,
          useValue: {
            findPublishedByChapterId: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CurriculumService);
    subjectRepository = module.get(SubjectRepository);
    chapterRepository = module.get(ChapterRepository);
    lessonRepository = module.get(LessonRepository);
  });

  it('should list subjects', async () => {
    subjectRepository.findPublishedByFilter.mockResolvedValue([
      { toJSON: jest.fn().mockReturnValue({ name: 'Mathematics' }) },
    ] as any);

    await expect(
      service.listSubjects({
        classLevel: 8,
        medium: CurriculumMedium.BANGLA,
        curriculumYear: 2026,
      }),
    ).resolves.toEqual([{ name: 'Mathematics' }]);
  });

  it('should throw when subject is missing', async () => {
    subjectRepository.findById.mockResolvedValue(null);

    await expect(service.getSubject('missing')).rejects.toThrow(NotFoundException);
  });

  it('should list chapters for a subject', async () => {
    subjectRepository.findById.mockResolvedValue({ _id: 'sub-1' } as any);
    chapterRepository.findPublishedBySubjectId.mockResolvedValue([
      { toJSON: jest.fn().mockReturnValue({ title: 'Chapter 1' }) },
    ] as any);

    await expect(service.listChapters('sub-1')).resolves.toEqual([{ title: 'Chapter 1' }]);
  });

  it('should list lessons for a chapter', async () => {
    chapterRepository.findById.mockResolvedValue({ _id: 'chap-1' } as any);
    lessonRepository.findPublishedByChapterId.mockResolvedValue([
      { toJSON: jest.fn().mockReturnValue({ title: 'Lesson 1' }) },
    ] as any);

    await expect(service.listLessons('chap-1')).resolves.toEqual([{ title: 'Lesson 1' }]);
  });
});
