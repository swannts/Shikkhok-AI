import { Router, Request, Response } from 'express';
import { practiceService } from '../modules/practice/practice.service';


const router = Router();

const mockPracticeSession = {
  sessionId: 'session-101',
  topicTitle: 'এক চলক বিশিষ্ট সরল সমীকরণ',
  questions: [
    {
      id: 'q1',
      questionText: '2x + 6 = 14 হলে, x এর মান কত?',
      options: [
        { id: 'opt1', text: 'x = 3' },
        { id: 'opt2', text: 'x = 4' },
        { id: 'opt3', text: 'x = 5' },
        { id: 'opt4', text: 'x = 6' },
      ],
      correctOptionId: 'opt2',
      explanation: '2x = 14 - 6 = 8, অতএব x = 8 / 2 = 4।',
    },
    {
      id: 'q2',
      questionText: '5y - 7 = 3y + 5 হলে, y এর মান কত?',
      options: [
        { id: 'opt1', text: 'y = 4' },
        { id: 'opt2', text: 'y = 6' },
        { id: 'opt3', text: 'y = 8' },
        { id: 'opt4', text: 'y = 10' },
      ],
      correctOptionId: 'opt2',
      explanation: '5y - 3y = 5 + 7 => 2y = 12 => y = 6।',
    },
    {
      id: 'q3',
      questionText: 'একটি সংখ্যার ৩ গুণের সাথে ৪ যোগ করলে যোগফল ১৯ হয়। সংখ্যাটি কত?',
      options: [
        { id: 'opt1', text: '৪' },
        { id: 'opt2', text: '৫' },
        { id: 'opt3', text: '৬' },
        { id: 'opt4', text: '৭' },
      ],
      correctOptionId: 'opt2',
      explanation: 'ধরি সংখ্যাটি x। প্রশ্নমতে, 3x + 4 = 19 => 3x = 15 => x = 5।',
    },
    {
      id: 'q4',
      questionText: 'x/2 + 3 = 7 হলে, x এর মান কত?',
      options: [
        { id: 'opt1', text: 'x = 4' },
        { id: 'opt2', text: 'x = 6' },
        { id: 'opt3', text: 'x = 8' },
        { id: 'opt4', text: 'x = 10' },
      ],
      correctOptionId: 'opt3',
      explanation: 'x/2 = 7 - 3 = 4 => x = 4 * 2 = 8।',
    },
    {
      id: 'q5',
      questionText: 'কোন সমীকরণের মূল বা বীজ বলতে কী বোঝায়?',
      options: [
        { id: 'opt1', text: 'চলকের যে মানের জন্য সমীকরণের দুই পক্ষ সমান হয়' },
        { id: 'opt2', text: 'সমীকরণের সর্বোচ্চ ঘাত' },
        { id: 'opt3', text: 'সমীকরণের ধ্রুবক পদ' },
        { id: 'opt4', text: 'চলকের সহগ' },
      ],
      correctOptionId: 'opt1',
      explanation: 'চলকের যে নির্দিষ্ট মানের জন্য সমীকরণের উভয় পক্ষ সিদ্ধ বা সমান হয়, তাকে সমীকরণের মূল বলা হয়।',
    },
  ],
};


router.get('/session', (req: Request, res: Response) => {
  return res.json(mockPracticeSession);
});

router.post('/evaluate-answer', async (req: Request, res: Response) => {
  const { studentId = 'default-student', practiceSessionId, questionId, selectedOptionId, topicId = 'linear-eq', topicTitle = 'সমীকরণ' } = req.body;
  const question = mockPracticeSession.questions.find((q) => q.id === questionId);

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  const result = await practiceService.evaluateAndPersistAnswer({
    studentId,
    practiceSessionId,
    questionId,
    selectedOptionId,
    correctOptionId: question.correctOptionId,
    topicId,
    topicTitle,
    explanation: question.explanation,
  });

  return res.json(result);
});

router.post('/submit', async (req: Request, res: Response) => {
  const { sessionId, answers, timeSpentSeconds, initialMastery = 42 } = req.body;

  let correctCount = 0;
  const userAnswers = answers || {};

  mockPracticeSession.questions.forEach((q) => {
    if (userAnswers[q.id] === q.correctOptionId) {
      correctCount++;
    }
  });

  const total = mockPracticeSession.questions.length;
  const summary = await practiceService.submitSessionSummary(
    sessionId || mockPracticeSession.sessionId,
    {
      correctAnswers: correctCount,
      totalQuestions: total,
      timeSpentSeconds: timeSpentSeconds || 115,
      initialMastery,
      weakTopics: correctCount < total ? ['ভগ্নাংশের সমীকরণ'] : [],
    }
  );

  return res.json({
    sessionId: sessionId || mockPracticeSession.sessionId,
    correctAnswers: correctCount,
    totalQuestions: total,
    accuracyPercentage: summary.accuracyPercentage,
    timeSpentSeconds: timeSpentSeconds || 115,
    initialMastery,
    updatedMastery: summary.updatedMastery,
    weakTopics: summary.weakTopics,
  });
});

export default router;

