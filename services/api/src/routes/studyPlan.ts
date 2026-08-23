import { Router, Request, Response } from 'express';
import { studyPlanEngine, StudentStudyContext } from '../modules/studyPlan/studyPlan.engine';

const router = Router();

const defaultContext: StudentStudyContext = {
  studentClass: 'class-8',
  availableStudyMinutes: 60,
  examGoal: 'exam_prep',
  weakTopics: [
    { id: 'wt1', title: 'ভগ্নাংশের সমীকরণ সমাধান', subject: 'গণিত', accuracy: 45 },
  ],
  unfinishedLessons: [
    { id: 'l1', title: 'সালোকসংশ্লেষণ অধ্যায়ের MCQ প্র্যাকটিস', subject: 'বিজ্ঞান', estimatedMinutes: 15 },
    { id: 'l2', title: 'Right Forms of Verbs এর নিয়মাবলী', subject: 'ইংরেজি', estimatedMinutes: 25 },
  ],
  subjectMastery: {
    math: 45,
    science: 65,
    english: 84,
  },
};

router.get('/daily', (req: Request, res: Response) => {
  const context: StudentStudyContext = {
    ...defaultContext,
    availableStudyMinutes: req.query.minutes ? parseInt(req.query.minutes as string, 10) : 60,
  };

  const plan = studyPlanEngine.generateDeterministicPlan(context);
  const planWithAi = studyPlanEngine.attachAiExplanation(plan, context);

  return res.json(planWithAi);
});

export default router;

