import { delay } from '../client';
import { Subject } from '../types';

const mockSubjects: Subject[] = [
  {
    id: 'math',
    bnName: 'গণিত',
    enName: 'Mathematics',
    icon: '📐',
    chapterCount: 8,
    lessonCount: 36,
    progress: 0.65,
    colorBg: '#EFF4FF',
  },
  {
    id: 'science',
    bnName: 'বিজ্ঞান',
    enName: 'Science',
    icon: '🧪',
    chapterCount: 10,
    lessonCount: 42,
    progress: 0.5,
    colorBg: '#E5EEFF',
  },
  {
    id: 'english',
    bnName: 'ইংরেজি',
    enName: 'English',
    icon: '🔤',
    chapterCount: 6,
    lessonCount: 24,
    progress: 0.8,
    colorBg: '#FFD8E7',
  },
  {
    id: 'bangla',
    bnName: 'বাংলা',
    enName: 'Bangla',
    icon: '📖',
    chapterCount: 7,
    lessonCount: 28,
    progress: 0.7,
    colorBg: '#FFDAD6',
  },
  {
    id: 'ict',
    bnName: 'ICT',
    enName: 'Information & Tech',
    icon: '💻',
    chapterCount: 5,
    lessonCount: 20,
    progress: 0.6,
    colorBg: '#DCE9FF',
  },
];

export const subjectRepository = {
  getSubjects: async (classId: string = 'class-8'): Promise<Subject[]> => {
    await delay(300);
    return mockSubjects;
  },
  getSubjectById: async (subjectId: string): Promise<Subject | null> => {
    await delay(200);
    return mockSubjects.find((s) => s.id === subjectId) || mockSubjects[0];
  },
};
