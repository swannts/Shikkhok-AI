import { delay } from '../client';

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  completed: boolean;
}

export interface StudyPlanData {
  dailyGoalMinutes: number;
  completedMinutes: number;
  recommendationReason: string;
  tasks: StudyTask[];
}

const mockPlan: StudyPlanData = {
  dailyGoalMinutes: 30,
  completedMinutes: 10,
  recommendationReason: 'গত সপ্তাহে বীজগণিত সরল সমীকরণে কিছু ভুল হয়েছিল। আজ ১০ মিনিট এই বিষয়টি ঝালাই করো।',
  tasks: [
    { id: 't1', title: 'বিজ্ঞান: সালোকসংশ্লেষণ পাঠ রিভিশন', subject: 'বিজ্ঞান', durationMinutes: 10, completed: true },
    { id: 't2', title: 'গণিত: সরল সমীকরণ প্র্যাকটিস সেসশ', subject: 'গণিত', durationMinutes: 10, completed: false },
    { id: 't3', title: 'ইংরেজি: Vocabulary 10 Words', subject: 'ইংরেজি', durationMinutes: 5, completed: false },
    { id: 't4', title: 'আজকের কুইজ পরীক্ষা', subject: 'সাধারণ', durationMinutes: 5, completed: false },
  ],
};

export const studyPlanRepository = {
  getDailyStudyPlan: async (studentId: string = 'student-1'): Promise<StudyPlanData> => {
    await delay(300);
    return mockPlan;
  },

  toggleTaskCompletion: async (taskId: string): Promise<StudyPlanData> => {
    await delay(200);
    mockPlan.tasks = mockPlan.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    mockPlan.completedMinutes = mockPlan.tasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + t.durationMinutes, 0);
    return { ...mockPlan };
  },
};
