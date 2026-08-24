import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { PracticeQuestionRepository } from './repositories/practice-question.repository';
import { PracticeAttemptRepository } from './repositories/practice-attempt.repository';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import { PracticeQuestionType } from './enums/practice-question-type.enum';
import { PracticeDifficulty } from './enums/practice-difficulty.enum';
import { ProgressService } from '../progress/progress.service';
import { ProgressStatus } from '../progress/enums/progress-status.enum';
import { LessonRepository } from '../curriculum/repositories/lesson.repository';
import { ChapterRepository } from '../curriculum/repositories/chapter.repository';
import { SubjectRepository } from '../curriculum/repositories/subject.repository';
import { MasteryEngineV1 } from './domain/mastery-engine-v1';
import { PracticeQuestionStudentResponse } from './types/practice-question-student-response';

@Injectable()
export class PracticeService {
  constructor(
    private readonly practiceQuestionRepository: PracticeQuestionRepository,
    private readonly practiceAttemptRepository: PracticeAttemptRepository,
    private readonly progressService: ProgressService,
    private readonly lessonRepository: LessonRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly usersService: UsersService,
    private readonly masteryEngine: MasteryEngineV1 = new MasteryEngineV1(),
  ) {}

  async listQuestions(
    currentUser: AuthenticatedUser,
    lessonId: string,
    limit = 10,
    difficulty?: PracticeDifficulty,
  ): Promise<PracticeQuestionStudentResponse[]> {
    await this.assertStudentOrAdmin(currentUser);
    const questions = await this.practiceQuestionRepository.findPublishedByLesson(
      lessonId,
      limit,
      difficulty,
    );
    return questions.map((question) => this.serializeQuestionForStudent(question));
  }

  async submitAttempt(
    currentUser: AuthenticatedUser,
    dto: SubmitPracticeAttemptDto,
  ): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    if (dto.studentId && dto.studentId !== currentUser.userId) {
      throw new ForbiddenException('You can only submit practice for your own account');
    }

    const question = await this.practiceQuestionRepository.findById(dto.questionId);
    if (!question || !question.isPublished) {
      throw new NotFoundException('Practice question not found');
    }

    if (question.questionType !== dto.questionType) {
      throw new BadRequestException('Question type does not match the stored practice question');
    }

    const evaluation = this.evaluateAttempt(question.questionType, question, dto);
    const score = evaluation.isCorrect ? 100 : (evaluation.partialScore ?? 0);

    const attempt = await this.practiceAttemptRepository.createAttempt({
      userId: currentUser.userId,
      questionId: dto.questionId,
      questionType: question.questionType,
      isCorrect: evaluation.isCorrect,
      score,
      timeSpentSeconds: dto.timeSpentSeconds ?? 0,
      submittedAnswer: evaluation.submittedAnswer,
      evaluation,
    });

    const lesson = await this.lessonRepository.findById(question.lessonId.toString());
    if (!lesson) {
      throw new NotFoundException('Lesson not found for practice question');
    }

    const chapter = await this.chapterRepository.findById(question.chapterId.toString());
    if (!chapter) {
      throw new NotFoundException('Chapter not found for practice question');
    }

    const subject = await this.subjectRepository.findById(question.subjectId.toString());
    if (!subject) {
      throw new NotFoundException('Subject not found for practice question');
    }

    const existingProgress = await this.progressService
      .getMyLessonProgress(currentUser, lesson._id.toString())
      .catch(() => null);
    const previousMastery =
      typeof existingProgress?.masteryScore === 'number' ? existingProgress.masteryScore : 0;
    const masteryResult = this.masteryEngine.calculate({
      previousMastery,
      isCorrect: evaluation.isCorrect,
      score,
      difficulty: question.difficulty,
    });

    await this.progressService.upsertMyLessonProgress(currentUser, lesson._id.toString(), {
      status: existingProgress?.status ?? ProgressStatus.IN_PROGRESS,
      progressPercent: existingProgress?.progressPercent ?? 0,
      timeSpentMinutes: Math.ceil((dto.timeSpentSeconds ?? 0) / 60),
      attemptCount: (existingProgress?.attemptCount ?? 0) + 1,
      masteryScore: masteryResult.newMastery,
    });

    return {
      attempt: attempt.toJSON(),
      isCorrect: evaluation.isCorrect,
      score,
      partialScore: evaluation.partialScore ?? 0,
      updatedLessonProgress: {
        lessonId: lesson._id.toString(),
        chapterId: chapter._id.toString(),
        subjectId: subject._id.toString(),
        masteryScore: masteryResult.newMastery,
        masteryDelta: masteryResult.delta,
        masteryAlgorithmVersion: masteryResult.algorithmVersion,
      },
      adaptiveRecommendation: this.getAdaptiveRecommendation(
        masteryResult.newMastery,
        evaluation.isCorrect,
      ),
    };
  }

  async getMyRecentAttempts(currentUser: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.assertStudentOrAdmin(currentUser);
    const attempts = await this.practiceAttemptRepository.findRecentByUserId(currentUser.userId);
    return attempts.map((attempt) => attempt.toJSON());
  }

  private evaluateAttempt(
    type: PracticeQuestionType,
    question: any,
    dto: SubmitPracticeAttemptDto,
  ): Record<string, any> {
    switch (type) {
      case PracticeQuestionType.MCQ:
      case PracticeQuestionType.TRUE_FALSE: {
        const selected = dto.selectedOptionId ?? null;
        const correctOptionId = question.correctOptionIds?.[0] ?? null;
        return {
          isCorrect: selected !== null && selected === correctOptionId,
          partialScore: selected !== null && selected === correctOptionId ? 100 : 0,
          submittedAnswer: { selectedOptionId: selected },
          correctAnswer: { correctOptionIds: question.correctOptionIds },
        };
      }
      case PracticeQuestionType.SHORT_ANSWER: {
        const answer = this.normalizeText(dto.textAnswer ?? '');
        const accepted = (question.acceptedAnswers ?? []).map((item: string) =>
          this.normalizeText(item),
        );
        const isCorrect = accepted.includes(answer);
        return {
          isCorrect,
          partialScore: isCorrect ? 100 : 0,
          submittedAnswer: { textAnswer: dto.textAnswer ?? '' },
          correctAnswer: { acceptedAnswers: question.acceptedAnswers ?? [] },
        };
      }
      case PracticeQuestionType.NUMERIC: {
        const answerValue = dto.numericAnswer;
        const expected = Number(question.answerConfig?.expectedValue);
        const tolerance = Number(question.answerConfig?.tolerance ?? 0);
        const isCorrect =
          typeof answerValue === 'number' &&
          !Number.isNaN(expected) &&
          Math.abs(answerValue - expected) <= tolerance;
        return {
          isCorrect,
          partialScore: isCorrect ? 100 : 0,
          submittedAnswer: { numericAnswer: answerValue },
          correctAnswer: {
            expectedValue: expected,
            tolerance,
          },
        };
      }
      case PracticeQuestionType.MULTI_SELECT: {
        const selectedIds = [...new Set(dto.selectedOptionIds ?? [])].sort();
        const correctIds = [...new Set(question.correctOptionIds ?? [])].sort();
        const isCorrect =
          selectedIds.length === correctIds.length &&
          selectedIds.every((value, index) => value === correctIds[index]);
        return {
          isCorrect,
          partialScore: isCorrect ? 100 : 0,
          submittedAnswer: { selectedOptionIds: selectedIds },
          correctAnswer: { correctOptionIds: correctIds },
        };
      }
      case PracticeQuestionType.MATCHING: {
        const submitted = dto.matchingAnswer ?? {};
        const expected = question.answerConfig?.pairs ?? {};
        const submittedKeys = Object.keys(submitted).sort();
        const expectedKeys = Object.keys(expected).sort();
        const isCorrect =
          submittedKeys.length === expectedKeys.length &&
          submittedKeys.every((key) => expected[key] === submitted[key]);
        return {
          isCorrect,
          partialScore: isCorrect ? 100 : 0,
          submittedAnswer: { matchingAnswer: submitted },
          correctAnswer: { pairs: expected },
        };
      }
      default:
        throw new BadRequestException('Unsupported practice question type');
    }
  }

  private getAdaptiveRecommendation(masteryScore: number, isCorrect: boolean): Record<string, any> {
    if (isCorrect && masteryScore >= 80) {
      return {
        recommendedDifficulty: PracticeDifficulty.HARD,
        nextStep: 'advance_recommended',
      };
    }

    if (masteryScore < 45) {
      return {
        recommendedDifficulty: PracticeDifficulty.EASY,
        nextStep: 'review_foundation',
      };
    }

    return {
      recommendedDifficulty: PracticeDifficulty.MEDIUM,
      nextStep: isCorrect ? 'keep_practicing' : 'reinforce_topic',
    };
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private serializeQuestionForStudent(question: any): PracticeQuestionStudentResponse {
    return {
      id: question._id.toString(),
      subjectId: question.subjectId.toString(),
      chapterId: question.chapterId.toString(),
      lessonId: question.lessonId.toString(),
      questionType: question.questionType,
      prompt: question.prompt,
      difficulty: question.difficulty,
      options: Array.isArray(question.options) ? [...question.options] : [],
      tags: Array.isArray(question.tags) ? [...question.tags] : [],
    };
  }

  private async assertStudentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can access practice features');
    }
  }
}
