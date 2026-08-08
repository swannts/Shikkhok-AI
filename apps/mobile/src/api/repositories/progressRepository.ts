import { delay } from '../client';
import { ProgressSummary } from '../types';

const mockProgress: ProgressSummary = {
  overallMastery: 72,
  studyTimeHours: 14.5,
  accuracyRate: 78,
  needsAttention: [
    { topic: 'সরল সমীকরণ (Linear Equations)', mastery: 42 },
    { topic: 'ভগ্নাংশের যোগ-বিয়োগ (Fractions)', mastery: 55 },
    { topic: 'Right Forms of Verbs', mastery: 58 },
  ],
  subjectMastery: [
    { subject: 'গণিত', mastery: 75 },
    { subject: 'বিজ্ঞান', mastery: 60 },
    { subject: 'ইংরেজি', mastery: 80 },
    { subject: 'বাংলা', mastery: 70 },
  ],
};

export const progressRepository = {
  getProgressSummary: async (studentId: string = 'student-1'): Promise<ProgressSummary> => {
    await delay(300);
    return mockProgress;
  },
};
