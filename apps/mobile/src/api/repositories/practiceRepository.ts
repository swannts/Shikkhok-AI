import { delay } from '../client';

export interface PracticeQuestion {
  id: string;
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface PracticeSession {
  sessionId: string;
  topicTitle: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  questions: PracticeQuestion[];
}

export interface PracticeResultData {
  sessionId: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  initialMastery: number;
  updatedMastery: number;
  weakTopics: string[];
}

const mockSession: PracticeSession = {
  sessionId: 'prac-session-1',
  topicTitle: 'সরল সমীকরণ (Linear Equations)',
  totalQuestions: 5,
  timeLimitMinutes: 10,
  questions: [
    {
      id: 'q1',
      questionText: '3x − 7 = 14 হলে x এর মান কত?',
      options: [
        { label: 'A', text: '5', isCorrect: false },
        { label: 'B', text: '6', isCorrect: false },
        { label: 'C', text: '7', isCorrect: true },
        { label: 'D', text: '8', isCorrect: false },
      ],
      explanation: '3x − 7 = 14 ⇒ 3x = 21 ⇒ x = 7। অতএব সঠিক উত্তর C।',
    },
    {
      id: 'q2',
      questionText: '2x + 5 = 15 হলে x এর মান কত?',
      options: [
        { label: 'A', text: '5', isCorrect: true },
        { label: 'B', text: '10', isCorrect: false },
        { label: 'C', text: '7', isCorrect: false },
        { label: 'D', text: '3', isCorrect: false },
      ],
      explanation: '2x = 10 ⇒ x = 5। অতএব সঠিক উত্তর A।',
    },
    {
      id: 'q3',
      questionText: '5x - 10 = 0 হলে x এর মান কত?',
      options: [
        { label: 'A', text: '1', isCorrect: false },
        { label: 'B', text: '2', isCorrect: true },
        { label: 'C', text: '5', isCorrect: false },
        { label: 'D', text: '10', isCorrect: false },
      ],
      explanation: '5x = 10 ⇒ x = 2। অতএব সঠিক উত্তর B।',
    },
    {
      id: 'q4',
      questionText: 'x/2 + 3 = 7 হলে x এর মান কত?',
      options: [
        { label: 'A', text: '4', isCorrect: false },
        { label: 'B', text: '6', isCorrect: false },
        { label: 'C', text: '8', isCorrect: true },
        { label: 'D', text: '10', isCorrect: false },
      ],
      explanation: 'x/2 = 4 ⇒ x = 8। অতএব সঠিক উত্তর C।',
    },
    {
      id: 'q5',
      questionText: '4x + 4 = 20 হলে x এর মান কত?',
      options: [
        { label: 'A', text: '4', isCorrect: true },
        { label: 'B', text: '5', isCorrect: false },
        { label: 'C', text: '6', isCorrect: false },
        { label: 'D', text: '8', isCorrect: false },
      ],
      explanation: '4x = 16 ⇒ x = 4। অতএব সঠিক উত্তর A।',
    },
  ],
};

export const practiceRepository = {
  getPracticeSession: async (
    topicId?: string,
    questionCount: number = 5
  ): Promise<PracticeSession> => {
    await delay(350);
    return mockSession;
  },

  submitPracticeResults: async (
    sessionId: string,
    answers: Record<string, string>,
    timeSpentSeconds: number
  ): Promise<PracticeResultData> => {
    await delay(400);
    let correct = 0;
    mockSession.questions.forEach((q) => {
      const selectedOption = q.options.find((opt) => opt.label === answers[q.id]);
      if (selectedOption?.isCorrect) {
        correct += 1;
      }
    });

    const total = mockSession.questions.length;
    const accuracy = Math.round((correct / total) * 100);

    return {
      sessionId,
      correctAnswers: correct,
      totalQuestions: total,
      accuracyPercentage: accuracy,
      timeSpentSeconds,
      initialMastery: 42,
      updatedMastery: Math.min(100, 42 + Math.round(accuracy * 0.2)),
      weakTopics: accuracy < 100 ? ['ভগ্নাংশের সমীকরণ', 'ঋণাত্মক সংখ্যা'] : [],
    };
  },
};
