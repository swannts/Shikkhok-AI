import { prisma } from '../../db';

const mockSubjects = [
  {
    id: 'math',
    classId: 'class-8',
    bnName: 'গণিত',
    enName: 'Mathematics',
    icon: '📐',
    chapterCount: 10,
    lessonCount: 42,
    progress: 0.45,
    colorBg: '#EEF2FF',
  },
  {
    id: 'science',
    classId: 'class-8',
    bnName: 'বিজ্ঞান',
    enName: 'General Science',
    icon: '🔬',
    chapterCount: 8,
    lessonCount: 36,
    progress: 0.6,
    colorBg: '#ECFDF5',
  },
  {
    id: 'english',
    classId: 'class-8',
    bnName: 'ইংরেজি',
    enName: 'English Grammar & Composition',
    icon: '🔤',
    chapterCount: 12,
    lessonCount: 50,
    progress: 0.3,
    colorBg: '#FEF3C7',
  },
];

const mockChapters: Record<string, any[]> = {
  math: [
    {
      id: 'algebra-ch-1',
      subjectId: 'math',
      chapterNumber: 1,
      bnTitle: 'অধ্যায় ১: বীজগণিতীয় রাশি ও সমীকরণ',
      enTitle: 'Chapter 1: Algebraic Expressions',
      lessonCount: 5,
      practiceSetCount: 3,
      progress: 0.6,
    },
    {
      id: 'geometry-ch-2',
      subjectId: 'math',
      chapterNumber: 2,
      bnTitle: 'অধ্যায় ২: জ্যামিতি ও ত্রিভুজ',
      enTitle: 'Chapter 2: Geometry & Triangles',
      lessonCount: 4,
      practiceSetCount: 2,
      progress: 0.2,
    },
  ],
};

export class CurriculumRepository {
  async getSubjects(classId: string) {
    try {
      const subjects = await prisma.subject.findMany({ where: { classId } });
      return subjects.length > 0 ? subjects : mockSubjects;
    } catch {
      return mockSubjects;
    }
  }

  async getChaptersBySubject(subjectId: string) {
    try {
      const chapters = await prisma.chapter.findMany({ where: { subjectId } });
      return chapters.length > 0 ? chapters : mockChapters[subjectId] || mockChapters.math;
    } catch {
      return mockChapters[subjectId] || mockChapters.math;
    }
  }
}

export const curriculumRepository = new CurriculumRepository();
