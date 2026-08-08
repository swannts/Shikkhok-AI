import { delay } from '../client';
import { Chapter } from '../types';

const mockChapters: Chapter[] = [
  {
    id: 'chap-1',
    subjectId: 'math',
    chapterNumber: 1,
    bnTitle: 'প্যাটার্ন',
    enTitle: 'Pattern',
    lessonCount: 4,
    practiceSetCount: 8,
    progress: 1.0,
  },
  {
    id: 'chap-2',
    subjectId: 'math',
    chapterNumber: 2,
    bnTitle: 'মুনাফা',
    enTitle: 'Profit & Interest',
    lessonCount: 5,
    practiceSetCount: 10,
    progress: 0.8,
  },
  {
    id: 'chap-3',
    subjectId: 'math',
    chapterNumber: 3,
    bnTitle: 'বীজগণিতীয় রাশি',
    enTitle: 'Algebraic Expressions',
    lessonCount: 6,
    practiceSetCount: 12,
    progress: 0.6,
  },
  {
    id: 'chap-4',
    subjectId: 'math',
    chapterNumber: 4,
    bnTitle: 'সরল সমীকরণ',
    enTitle: 'Linear Equations',
    lessonCount: 5,
    practiceSetCount: 10,
    progress: 0.42,
  },
];

export const chapterRepository = {
  getChaptersBySubject: async (subjectId: string): Promise<Chapter[]> => {
    await delay(300);
    return mockChapters;
  },
  getChapterById: async (chapterId: string): Promise<Chapter | null> => {
    await delay(200);
    return mockChapters.find((c) => c.id === chapterId) || mockChapters[3];
  },
};
