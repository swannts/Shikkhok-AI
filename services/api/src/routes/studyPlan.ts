import { Router, Request, Response } from 'express';

const router = Router();

const mockStudyPlan = {
  date: 'আজ, ২৩ আগস্ট',
  completedCount: 1,
  totalCount: 3,
  tasks: [
    {
      id: 'task-1',
      title: 'সরল সমীকরণের ২ নং অনুশীলনী সম্পন্ন করা',
      subject: 'গণিত',
      durationMinutes: 20,
      completed: true,
    },
    {
      id: 'task-2',
      title: 'সালোকসংশ্লেষণ অধ্যায়ের ১০টি MCQ প্র্যাকটিস',
      subject: 'বিজ্ঞান',
      durationMinutes: 15,
      completed: false,
    },
    {
      id: 'task-3',
      title: 'Right Forms of Verbs এর নিয়মগুলো রিভিশন',
      subject: 'ইংরেজি',
      durationMinutes: 25,
      completed: false,
    },
  ],
};

router.get('/daily', (req: Request, res: Response) => {
  return res.json(mockStudyPlan);
});

router.post('/tasks/:taskId/toggle', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = mockStudyPlan.tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
  }
  mockStudyPlan.completedCount = mockStudyPlan.tasks.filter((t) => t.completed).length;
  return res.json(mockStudyPlan);
});

export default router;
