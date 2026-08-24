import 'reflect-metadata';
import { Types } from 'mongoose';
import { ExamScoringService } from '../services/exam-scoring.service';

describe('ExamScoringService', () => {
  let scoringService: ExamScoringService;

  const mockExam = {
    totalMarks: 50,
    passMarks: 20,
  } as any;

  const q1Id = new Types.ObjectId();
  const q2Id = new Types.ObjectId();

  const mockQuestions = [
    {
      _id: q1Id,
      correctAnswer: 'b',
      explanationBn: 'সঠিক উত্তর খ',
    },
    {
      _id: q2Id,
      correctAnswer: '৫',
      explanationBn: 'সঠিক সংখ্যা ৫',
    },
  ] as any[];

  beforeEach(() => {
    scoringService = new ExamScoringService();
  });

  it('should calculate correct score for matching English and Bengali numeral answers', () => {
    const answers = [
      { questionId: q1Id, submittedAnswer: 'B' },
      { questionId: q2Id, submittedAnswer: '5' }, // English 5 matches Bengali ৫
    ];

    const result = scoringService.evaluateExam(mockExam, mockQuestions, answers);
    expect(result.correctCount).toBe(2);
    expect(result.wrongCount).toBe(0);
    expect(result.unansweredCount).toBe(0);
    expect(result.score).toBe(50);
    expect(result.isPassed).toBe(true);
  });

  it('should penalize wrong answers and mark unanswered questions correctly', () => {
    const answers = [
      { questionId: q1Id, submittedAnswer: 'c' }, // wrong
      { questionId: q2Id, submittedAnswer: '' }, // unanswered
    ];

    const result = scoringService.evaluateExam(mockExam, mockQuestions, answers);
    expect(result.correctCount).toBe(0);
    expect(result.wrongCount).toBe(1);
    expect(result.unansweredCount).toBe(1);
    expect(result.score).toBe(0);
    expect(result.isPassed).toBe(false);
  });
});
