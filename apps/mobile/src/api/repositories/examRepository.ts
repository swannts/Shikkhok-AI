import { delay } from '../client';
import { PracticeQuestion } from './practiceRepository';

export interface ExamDetails {
  examId: string;
  title: string;
  subjectName: string;
  totalMarks: number;
  timeLimitMinutes: number;
  instructions: string[];
  questions: PracticeQuestion[];
}

export interface ExamResult {
  examId: string;
  score: number;
  totalMarks: number;
  accuracyRate: number;
  grade: string;
  timeTakenMinutes: number;
}

const mockExam: ExamDetails = {
  examId: 'model-test-1',
  title: 'গণিত অর্ধ-বার্ষিক মডেল টেস্ট',
  subjectName: 'সাধারণ গণিত • Class 8',
  totalMarks: 50,
  timeLimitMinutes: 20,
  instructions: [
    'পরীক্ষা শুরু করার পর টাইমার থামানো যাবে না।',
    'প্রতিটি প্রশ্নের জন্য ১ নম্বর বরাদ্দ।',
    'নেগেটিভ মার্কিং নেই।',
    'সব প্রশ্নের উত্তর দেওয়া শেষে Submit চাপুন।',
  ],
  questions: [
    {
      id: 'eq1',
      questionText: 'একটি সংখ্যা x। এর ৩ গুণের সাথে ৫ যোগ করলে যোগফল ২০ হয়। সমীকরণ কোনটি?',
      options: [
        { label: 'A', text: '3x + 5 = 20', isCorrect: true },
        { label: 'B', text: '3x - 5 = 20', isCorrect: false },
        { label: 'C', text: 'x + 15 = 20', isCorrect: false },
        { label: 'D', text: '5x + 3 = 20', isCorrect: false },
      ],
      explanation: '৩x + ৫ = ২০ হলো সঠিক সমীকরণ।',
    },
    {
      id: 'eq2',
      questionText: '4x = 28 হলে x = ?',
      options: [
        { label: 'A', text: '5', isCorrect: false },
        { label: 'B', text: '6', isCorrect: false },
        { label: 'C', text: '7', isCorrect: true },
        { label: 'D', text: '8', isCorrect: false },
      ],
      explanation: 'x = 28 / 4 = 7।',
    },
  ],
};

export const examRepository = {
  getExamDetails: async (examId: string = 'model-test-1'): Promise<ExamDetails> => {
    await delay(350);
    return mockExam;
  },

  submitExam: async (examId: string, answers: Record<string, string>): Promise<ExamResult> => {
    await delay(500);
    let correct = 0;
    mockExam.questions.forEach((q) => {
      const selected = q.options.find((opt) => opt.label === answers[q.id]);
      if (selected?.isCorrect) correct += 1;
    });

    const accuracy = Math.round((correct / mockExam.questions.length) * 100);
    let grade = 'A+';
    if (accuracy < 80) grade = 'A';
    if (accuracy < 60) grade = 'B';
    if (accuracy < 40) grade = 'C';

    return {
      examId,
      score: correct * 25,
      totalMarks: 50,
      accuracyRate: accuracy,
      grade,
      timeTakenMinutes: 12,
    };
  },
};
