import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { StudentsService } from '../students/students.service';
import { ExamRepository } from './repositories/exam.repository';
import { ExamSessionRepository } from './repositories/exam-session.repository';
import { ExamAnswerRepository } from './repositories/exam-answer.repository';
import { PracticeQuestionRepository } from '../practice/repositories/practice-question.repository';
import { ExamStatus } from './enums/exam-status.enum';
import { ExamSessionStatus } from './enums/exam-session-status.enum';
import { ListExamsQueryDto } from './dto/list-exams-query.dto';
import { SaveExamAnswerDto } from './dto/save-exam-answer.dto';
import { FlagExamQuestionDto } from './dto/flag-exam-question.dto';
import { ExamScoringService } from './services/exam-scoring.service';
import { ExamStateMachineService } from './services/exam-state-machine.service';

@Injectable()
export class ExamsService {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly sessionRepository: ExamSessionRepository,
    private readonly answerRepository: ExamAnswerRepository,
    private readonly questionRepository: PracticeQuestionRepository,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly scoringService: ExamScoringService,
    private readonly stateMachine: ExamStateMachineService,
  ) {}

  async listExams(
    currentUser: AuthenticatedUser,
    query: ListExamsQueryDto,
  ): Promise<Record<string, any>[]> {
    await this.assertStudentOrAdmin(currentUser);

    const classLevel = query.classLevel ?? (await this.resolveClassLevel(currentUser.userId));
    const medium = query.medium ?? (await this.resolveMedium(currentUser.userId));
    const curriculumYear =
      query.curriculumYear ?? (await this.resolveCurriculumYear(currentUser.userId));

    const exams = await this.examRepository.findPublished({
      classLevel,
      medium,
      curriculumYear,
      subjectId: query.subjectId,
    });

    return exams.map((exam) => {
      const json = exam.toJSON();
      return {
        _id: json._id,
        title: json.title,
        titleBn: json.titleBn,
        subjectId: json.subjectId,
        chapterIds: json.chapterIds,
        classLevel: json.classLevel,
        medium: json.medium,
        curriculumYear: json.curriculumYear,
        questionCount: json.questionIds?.length ?? 0,
        timeLimitMinutes: json.timeLimitMinutes,
        totalMarks: json.totalMarks,
        passMarks: json.passMarks,
        instructions: json.instructions,
        status: json.status,
        publishedAt: json.publishedAt,
        createdAt: json.createdAt,
      };
    });
  }

  async getExam(currentUser: AuthenticatedUser, examId: string): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const exam = await this.examRepository.findById(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.PUBLISHED && currentUser.role !== UserRole.ADMIN) {
      throw new NotFoundException('Exam not found or not published');
    }

    const json = exam.toJSON();
    return {
      _id: json._id,
      title: json.title,
      titleBn: json.titleBn,
      subjectId: json.subjectId,
      chapterIds: json.chapterIds,
      classLevel: json.classLevel,
      medium: json.medium,
      curriculumYear: json.curriculumYear,
      questionCount: json.questionIds?.length ?? 0,
      timeLimitMinutes: json.timeLimitMinutes,
      totalMarks: json.totalMarks,
      passMarks: json.passMarks,
      instructions: json.instructions,
      status: json.status,
      publishedAt: json.publishedAt,
      createdAt: json.createdAt,
    };
  }

  async startSession(currentUser: AuthenticatedUser, examId: string): Promise<Record<string, any>> {
    await this.assertStudentOrAdmin(currentUser);

    const exam = await this.examRepository.findById(examId);
    if (!exam || (exam.status !== ExamStatus.PUBLISHED && currentUser.role !== UserRole.ADMIN)) {
      throw new NotFoundException('Exam not found or unavailable');
    }

    // Check for existing active session
    const existingActive = await this.sessionRepository.findActiveSession(
      currentUser.userId,
      examId,
    );

    const now = new Date();
    if (existingActive) {
      if (!this.stateMachine.isSessionExpired(existingActive.expiresAt)) {
        return this.buildSessionPayload(existingActive, exam);
      }
      // Expired -> mark expired
      await this.sessionRepository.updateStatus(
        existingActive._id.toString(),
        ExamSessionStatus.EXPIRED,
      );
    }

    const startedAt = now;
    const expiresAt = new Date(startedAt.getTime() + exam.timeLimitMinutes * 60 * 1000);

    const session = await this.sessionRepository.createSession({
      studentId: currentUser.userId,
      examId,
      startedAt,
      expiresAt,
      status: ExamSessionStatus.ACTIVE,
    });

    return this.buildSessionPayload(session, exam);
  }

  async getSession(
    currentUser: AuthenticatedUser,
    sessionId: string,
  ): Promise<Record<string, any>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    await this.assertSessionOwnershipOrAdmin(currentUser, session);

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    // Check if session has expired
    if (
      session.status === ExamSessionStatus.ACTIVE &&
      this.stateMachine.isSessionExpired(session.expiresAt)
    ) {
      await this.sessionRepository.updateStatus(sessionId, ExamSessionStatus.EXPIRED);
      session.status = ExamSessionStatus.EXPIRED;
    }

    return this.buildSessionPayload(session, exam);
  }

  async saveAnswer(
    currentUser: AuthenticatedUser,
    sessionId: string,
    questionId: string,
    dto: SaveExamAnswerDto,
  ): Promise<Record<string, any>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    await this.assertSessionOwnershipOrAdmin(currentUser, session);

    if (this.stateMachine.isSessionExpired(session.expiresAt)) {
      await this.sessionRepository.updateStatus(sessionId, ExamSessionStatus.EXPIRED);
      throw new BadRequestException('EXAM_EXPIRED: Exam time limit has been exceeded');
    }

    // Validate state machine invariants
    this.stateMachine.assertCanAnswer(session.status, session.expiresAt);

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    const isValidQuestion = exam.questionIds.some((id) => id.toString() === questionId);
    if (!isValidQuestion) {
      throw new BadRequestException('Question does not belong to this exam');
    }

    const answer = await this.answerRepository.saveAnswer({
      sessionId,
      questionId,
      submittedAnswer: dto.submittedAnswer,
    });

    return answer.toJSON();
  }

  async flagQuestion(
    currentUser: AuthenticatedUser,
    sessionId: string,
    questionId: string,
    dto: FlagExamQuestionDto,
  ): Promise<Record<string, any>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    await this.assertSessionOwnershipOrAdmin(currentUser, session);

    this.stateMachine.assertCanAnswer(session.status, session.expiresAt);

    const answer = await this.answerRepository.setFlag(sessionId, questionId, dto.flagged ?? true);

    return answer ? answer.toJSON() : { sessionId, questionId, flagged: dto.flagged ?? true };
  }

  async submitSession(
    currentUser: AuthenticatedUser,
    sessionId: string,
  ): Promise<Record<string, any>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    await this.assertSessionOwnershipOrAdmin(currentUser, session);

    // Idempotent submit: if already submitted, return results
    if (session.status === ExamSessionStatus.SUBMITTED) {
      return this.getSessionResult(currentUser, sessionId);
    }

    this.stateMachine.validateTransition(session.status, ExamSessionStatus.SUBMITTED, sessionId);

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    const questions = await this.questionRepository.findManyByIds(exam.questionIds);
    const answers = await this.answerRepository.findBySessionId(sessionId);

    // Delegate grading to ExamScoringService
    const scoringSummary = this.scoringService.evaluateExam(exam, questions, answers);

    for (const evaluated of scoringSummary.evaluatedAnswers) {
      await this.answerRepository.gradeAnswer(
        sessionId,
        evaluated.questionId,
        evaluated.isCorrect,
        evaluated.marksObtained,
      );
    }

    const submittedSession = await this.sessionRepository.submitSession(sessionId, {
      score: scoringSummary.score,
      percentage: scoringSummary.percentage,
      correctCount: scoringSummary.correctCount,
      wrongCount: scoringSummary.wrongCount,
      unansweredCount: scoringSummary.unansweredCount,
      submittedAt: new Date(),
    });

    return {
      sessionId,
      examId: exam._id.toString(),
      status: ExamSessionStatus.SUBMITTED,
      score: scoringSummary.score,
      totalMarks: scoringSummary.totalMarks,
      percentage: scoringSummary.percentage,
      passed: scoringSummary.isPassed,
      correctCount: scoringSummary.correctCount,
      wrongCount: scoringSummary.wrongCount,
      unansweredCount: scoringSummary.unansweredCount,
      totalQuestions: questions.length,
      submittedAt: submittedSession?.submittedAt ?? new Date(),
    };
  }

  async getSessionResult(
    currentUser: AuthenticatedUser,
    sessionId: string,
  ): Promise<Record<string, any>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    await this.assertSessionOwnershipOrAdmin(currentUser, session);

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    const questions = await this.questionRepository.findManyByIds(exam.questionIds);
    const answers = await this.answerRepository.findBySessionId(sessionId);

    const answerMap = new Map<string, any>();
    for (const ans of answers) {
      answerMap.set(ans.questionId.toString(), ans.toJSON ? ans.toJSON() : ans);
    }

    const questionResults = questions.map((q) => {
      const qJson: any = q.toJSON ? q.toJSON() : q;
      const ans = answerMap.get(qJson._id.toString());
      return {
        questionId: qJson._id,
        prompt: qJson.prompt ?? qJson.questionText,
        questionText: qJson.questionText ?? qJson.prompt,
        options: qJson.options,
        correctOptionIds:
          qJson.correctOptionIds ?? (qJson.correctAnswer ? [qJson.correctAnswer] : []),
        correctAnswer: qJson.correctAnswer ?? qJson.correctOptionIds?.[0],
        submittedAnswer: ans?.submittedAnswer ?? null,
        isCorrect: ans?.isCorrect ?? false,
        marksObtained: ans?.marksObtained ?? ans?.marksAwarded ?? 0,
        explanationBn: qJson.answerConfig?.explanationBn ?? qJson.explanationBn,
      };
    });

    return {
      sessionId: session._id.toString(),
      examId: exam._id.toString(),
      status: session.status,
      score: session.score ?? 0,
      totalMarks: exam.totalMarks,
      percentage: session.percentage ?? 0,
      passed: exam.passMarks
        ? (session.score ?? 0) >= exam.passMarks
        : (session.percentage ?? 0) >= 40,
      correctCount: session.correctCount ?? 0,
      wrongCount: session.wrongCount ?? 0,
      unansweredCount: session.unansweredCount ?? 0,
      totalQuestions: questions.length,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      questions: questionResults,
    };
  }

  async getSessionReview(
    currentUser: AuthenticatedUser,
    sessionId: string,
  ): Promise<Record<string, any>> {
    return this.getSessionResult(currentUser, sessionId);
  }

  private async buildSessionPayload(session: any, exam: any): Promise<Record<string, any>> {
    const questions = await this.questionRepository.findManyByIds(exam.questionIds);
    const answers = await this.answerRepository.findBySessionId(session._id.toString());

    const answerMap = new Map<string, any>();
    for (const ans of answers) {
      answerMap.set(ans.questionId.toString(), ans.toJSON ? ans.toJSON() : ans);
    }

    const sanitizedQuestions = questions.map((q) => {
      const qJson: any = q.toJSON ? q.toJSON() : q;
      const ans = answerMap.get(qJson._id.toString());
      return {
        _id: qJson._id,
        prompt: qJson.prompt ?? qJson.questionText,
        questionText: qJson.questionText ?? qJson.prompt,
        options: qJson.options?.map((opt: any) =>
          typeof opt === 'string'
            ? { key: opt, text: opt }
            : { key: opt?.key ?? opt?.text, text: opt?.text ?? opt?.key },
        ),
        submittedAnswer: ans?.submittedAnswer ?? null,
        isFlagged: ans?.isFlagged ?? false,
      };
    });

    return {
      sessionId: session._id.toString(),
      examId: exam._id.toString(),
      status: session.status,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      timeLimitMinutes: exam.timeLimitMinutes,
      totalMarks: exam.totalMarks,
      questions: sanitizedQuestions,
    };
  }

  private async assertStudentOrAdmin(currentUser: AuthenticatedUser): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only student accounts can access exams');
    }
  }

  private async assertSessionOwnershipOrAdmin(
    currentUser: AuthenticatedUser,
    session: any,
  ): Promise<void> {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (session.studentId.toString() !== currentUser.userId) {
      throw new ForbiddenException('You can only access your own exam sessions');
    }
  }

  private async resolveClassLevel(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.classLevel ?? 8;
    } catch {
      return 8;
    }
  }

  private async resolveMedium(userId: string): Promise<string> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.medium ?? 'bangla';
    } catch {
      return 'bangla';
    }
  }

  private async resolveCurriculumYear(userId: string): Promise<number> {
    try {
      const profile = await this.studentsService?.getProfileByUserId?.(userId);
      return profile?.curriculumYear ?? 2026;
    } catch {
      return 2026;
    }
  }
}
