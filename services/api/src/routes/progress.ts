import { Router, Request, Response } from 'express';

const router = Router();

router.get('/summary', (req: Request, res: Response) => {
  return res.json({
    overallMastery: 74,
    studyTimeHours: 18.5,
    accuracyRate: 82,
    streakDays: 5,
    subjectProgress: [
      { subjectId: 'math', bnName: 'গণিত', masteryPercentage: 78, colorBg: '#4F46E5' },
      { subjectId: 'science', bnName: 'বিজ্ঞান', masteryPercentage: 65, colorBg: '#10B981' },
      { subjectId: 'english', bnName: 'ইংরেজি', masteryPercentage: 84, colorBg: '#F59E0B' },
    ],
    weakTopics: [
      { id: 'wt1', title: 'ভগ্নাংশের সমীকরণ সমাধান', subject: 'গণিত', accuracy: 45 },
      { id: 'wt2', title: 'Photosynthesis রাসায়নিক বিক্রিয়া', subject: 'বিজ্ঞান', accuracy: 50 },
    ],
  });
});

export default router;
