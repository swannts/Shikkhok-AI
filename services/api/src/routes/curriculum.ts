import { Router, Request, Response } from 'express';

const router = Router();

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

const mockLessons: Record<string, any> = {
  'linear-equations': {
    id: 'linear-equations',
    chapterId: 'algebra-ch-1',
    title: 'এক চলক বিশিষ্ট সরল সমীকরণ',
    estimatedMinutes: 15,
    progress: 0.8,
    blocks: [
      {
        id: 'b1',
        type: 'text',
        content: 'যে সমীকরণে একটি মাত্র অজ্ঞাত রাশি (চলক) থাকে এবং চলকটির ঘাত ১ হয়, তাকে **এক চলক বিশিষ্ট সরল সমীকরণ** বলে।',
      },
      {
        id: 'b2',
        type: 'formula',
        content: 'ax + b = 0 \\quad (a \\neq 0)',
      },
      {
        id: 'b3',
        type: 'example',
        content: 'উদাহরণ: 2x + 5 = 15 সমীকরণের সমাধান করো।\n\n**সমাধান:**\n2x = 15 - 5\n2x = 10\nx = 5',
      },
      {
        id: 'b4',
        type: 'quiz',
        content: '3x - 4 = 11 হলে x এর মান কত?',
        quizData: {
          question: '3x - 4 = 11 হলে x এর মান কত?',
          options: ['3', '5', '4', '15'],
          correctIndex: 1,
          explanation: '3x = 11 + 4 = 15, সুতরাং x = 15 / 3 = 5',
        },
      },
    ],
  },
};

router.get('/subjects', (req: Request, res: Response) => {
  return res.json(mockSubjects);
});

router.get('/subjects/:subjectId/chapters', (req: Request, res: Response) => {
  const { subjectId } = req.params;
  const chapters = mockChapters[subjectId] || mockChapters.math;
  return res.json(chapters);
});

router.get('/lessons/:lessonId', (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const lesson = mockLessons[lessonId] || mockLessons['linear-equations'];
  return res.json(lesson);
});

export default router;
