import { Injectable } from '@nestjs/common';
import { PracticeQuestionDocument } from '../../practice/schemas/practice-question.schema';
import { ExamDocument } from '../schemas/exam.schema';

export interface EvaluatedAnswerResult {
  questionId: string;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  submittedAnswer?: string | null;
  correctAnswer?: string | null;
  explanationBn?: string | null;
}

export interface ExamScoreSummary {
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  isPassed: boolean;
  evaluatedAnswers: EvaluatedAnswerResult[];
}

@Injectable()
export class ExamScoringService {
  evaluateExam(
    exam: ExamDocument,
    questions: PracticeQuestionDocument[],
    answers: Array<{ questionId: any; submittedAnswer?: string | null }>,
  ): ExamScoreSummary {
    const totalQuestions = questions.length;
    const marksPerQuestion = totalQuestions > 0 ? exam.totalMarks / totalQuestions : 0;

    const answerMap = new Map<string, string | null>();
    for (const ans of answers) {
      if (ans.questionId) {
        answerMap.set(ans.questionId.toString(), ans.submittedAnswer ?? null);
      }
    }

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const evaluatedAnswers: EvaluatedAnswerResult[] = [];

    for (const question of questions) {
      const qAny = question as any;
      const qId = qAny._id.toString();
      const submitted = answerMap.get(qId);
      const correctAnswer =
        qAny.correctOptionIds?.[0] ??
        qAny.acceptedAnswers?.[0] ??
        qAny.correctAnswer ??
        '';
      const explanationBn =
        qAny.answerConfig?.explanationBn ??
        qAny.explanationBn ??
        'সঠিক উত্তর পর্যালোচনা';

      if (!submitted || submitted.trim() === '') {
        unansweredCount++;
        evaluatedAnswers.push({
          questionId: qId,
          isCorrect: false,
          marksObtained: 0,
          maxMarks: marksPerQuestion,
          submittedAnswer: null,
          correctAnswer,
          explanationBn,
        });
        continue;
      }

      const isCorrect = this.isAnswerCorrect(submitted, qAny);

      if (isCorrect) {
        correctCount++;
        score += marksPerQuestion;
        evaluatedAnswers.push({
          questionId: qId,
          isCorrect: true,
          marksObtained: marksPerQuestion,
          maxMarks: marksPerQuestion,
          submittedAnswer: submitted,
          correctAnswer,
          explanationBn,
        });
      } else {
        wrongCount++;
        evaluatedAnswers.push({
          questionId: qId,
          isCorrect: false,
          marksObtained: 0,
          maxMarks: marksPerQuestion,
          submittedAnswer: submitted,
          correctAnswer,
          explanationBn,
        });
      }
    }

    const roundedScore = Math.round(score * 100) / 100;
    const percentage =
      exam.totalMarks > 0 ? Math.round((roundedScore / exam.totalMarks) * 10000) / 100 : 0;
    const isPassed = roundedScore >= exam.passMarks;

    return {
      score: roundedScore,
      totalMarks: exam.totalMarks,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      isPassed,
      evaluatedAnswers,
    };
  }

  private isAnswerCorrect(submitted: string, question: any): boolean {
    if (!submitted) return false;
    const clean = submitted.trim().toLowerCase();

    // 1. Check correctOptionIds
    if (
      Array.isArray(question.correctOptionIds) &&
      question.correctOptionIds.some((id: string) => String(id).trim().toLowerCase() === clean)
    ) {
      return true;
    }

    // 2. Check acceptedAnswers
    if (
      Array.isArray(question.acceptedAnswers) &&
      question.acceptedAnswers.some(
        (ans: string) =>
          this.toEnglishDigits(String(ans).trim().toLowerCase()) === this.toEnglishDigits(clean),
      )
    ) {
      return true;
    }

    // 3. Fallback direct correctAnswer
    if (question.correctAnswer) {
      return (
        this.toEnglishDigits(String(question.correctAnswer).trim().toLowerCase()) ===
        this.toEnglishDigits(clean)
      );
    }

    return false;
  }

  private toEnglishDigits(str: string): string {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[০-৯]/g, (d) => String(banglaDigits.indexOf(d)));
  }
}
