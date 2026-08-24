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

@Injectable()
export class ExamsService {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly sessionRepository: ExamSessionRepository,
    private readonly answerRepository: ExamAnswerRepository,
    private readonly questionRepository: PracticeQuestionRepository,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
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
      if (existingActive.expiresAt.getTime() > now.getTime()) {
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
    if (session.status === ExamSessionStatus.ACTIVE && Date.now() > session.expiresAt.getTime()) {
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

    if (session.status !== ExamSessionStatus.ACTIVE) {
      throw new BadRequestException(`Cannot answer questions on a ${session.status} exam session`);
    }

    if (Date.now() > session.expiresAt.getTime()) {
      await this.sessionRepository.updateStatus(sessionId, ExamSessionStatus.EXPIRED);
      throw new BadRequestException('EXAM_EXPIRED: Exam time limit has been exceeded');
    }

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

    if (session.status !== ExamSessionStatus.ACTIVE) {
      throw new BadRequestException(`Cannot flag questions on a ${session.status} exam session`);
    }

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

    // Idempotent submit
    if (session.status === ExamSessionStatus.SUBMITTED) {
      return this.getSessionResult(currentUser, sessionId);
    }

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    const questions = await this.questionRepository.findManyByIds(exam.questionIds);
    const answers = await this.answerRepository.findBySessionId(sessionId);

    const answerByQuestionId = new Map<string, any>();
    for (const ans of answers) {
      answerByQuestionId.set(ans.questionId.toString(), ans);
    }

    const marksPerQuestion = questions.length > 0 ? exam.totalMarks / questions.length : 0;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    for (const question of questions) {
      const qId = question._id.toString();
      const studentAns = answerByQuestionId.get(qId);

      if (
        !studentAns ||
        studentAns.submittedAnswer === null ||
        studentAns.submittedAnswer === undefined ||
        studentAns.submittedAnswer === ''
      ) {
        unansweredCount++;
        await this.answerRepository.gradeAnswer(sessionId, qId, false, 0);
        continue;
      }

      const isCorrect = this.evaluateAnswer(question, studentAns.submittedAnswer);
      if (isCorrect) {
        correctCount++;
        score += marksPerQuestion;
        await this.answerRepository.gradeAnswer(sessionId, qId, true, marksPerQuestion);
      } else {
        wrongCount++;
        await this.answerRepository.gradeAnswer(sessionId, qId, false, 0);
      }
    }

    const roundedScore = Math.round(score * 100) / 100;
    const percentage = exam.totalMarks > 0 ? Math.round((roundedScore / exam.totalMarks) * 100) : 0;

    const submittedSession = await this.sessionRepository.submitSession(sessionId, {
      score: roundedScore,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      submittedAt: new Date(),
    });

    return {
      sessionId,
      examId: exam._id.toString(),
      status: ExamSessionStatus.SUBMITTED,
      score: roundedScore,
      totalMarks: exam.totalMarks,
      percentage,
      passed: exam.passMarks ? roundedScore >= exam.passMarks : percentage >= 40,
      correctCount,
      wrongCount,
      unansweredCount,
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

    if (session.status !== ExamSessionStatus.SUBMITTED) {
      throw new BadRequestException('Exam session has not been submitted yet');
    }

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    return {
      sessionId,
      examId: exam._id.toString(),
      status: session.status,
      score: session.score,
      totalMarks: exam.totalMarks,
      percentage: session.percentage,
      passed: exam.passMarks ? session.score >= exam.passMarks : session.percentage >= 40,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      unansweredCount: session.unansweredCount,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
    };
  }

  async getSessionReview(
    currentUser: AuthenticatedUser,
    sessionId: string,
  ): Promise<Record<string, any>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    await this.assertSessionOwnershipOrAdmin(currentUser, session);

    if (session.status !== ExamSessionStatus.SUBMITTED && currentUser.role !== UserRole.ADMIN) {
      throw new BadRequestException('Exam review is only available after submission');
    }

    const exam = await this.examRepository.findById(session.examId.toString());
    if (!exam) {
      throw new NotFoundException('Associated exam not found');
    }

    const questions = await this.questionRepository.findManyByIds(exam.questionIds);
    const answers = await this.answerRepository.findBySessionId(sessionId);

    const answerMap = new Map<string, any>();
    for (const ans of answers) {
      answerMap.set(ans.questionId.toString(), ans.toJSON());
    }

    const reviewQuestions = questions.map((q) => {
      const qId = q._id.toString();
      const ans = answerMap.get(qId);
      return {
        questionId: qId,
        prompt: q.prompt,
        options: q.options,
        questionType: q.questionType,
        submittedAnswer: ans?.submittedAnswer ?? null,
        isCorrect: ans?.isCorrect ?? false,
        marksAwarded: ans?.marksAwarded ?? 0,
        correctOptionIds: q.correctOptionIds,
        acceptedAnswers: q.acceptedAnswers,
        flagged: ans?.flagged ?? false,
      };
    });

    return {
      session: session.toJSON(),
      exam: {
        _id: exam._id.toString(),
        title: exam.title,
        titleBn: exam.titleBn,
        totalMarks: exam.totalMarks,
      },
      questions: reviewQuestions,
    };
  }

  private async buildSessionPayload(session: any, exam: any): Promise<Record<string, any>> {
    const questions = await this.questionRepository.findManyByIds(exam.questionIds);
    const answers = await this.answerRepository.findBySessionId(session._id.toString());

    const answerMap = new Map<string, any>();
    for (const ans of answers) {
      answerMap.set(ans.questionId.toString(), ans.toJSON());
    }

    // Sanitize questions: strip correctOptionIds, acceptedAnswers, explanation
    const sanitizedQuestions = questions.map((q) => {
      const qId = q._id.toString();
      const ans = answerMap.get(qId);
      return {
        questionId: qId,
        prompt: q.prompt,
        options: q.options,
        questionType: q.questionType,
        submittedAnswer: ans?.submittedAnswer ?? null,
        flagged: ans?.flagged ?? false,
      };
    });

    const sessionData = typeof session.toJSON === 'function' ? session.toJSON() : session;

    return {
      session: sessionData,
      exam: {
        _id: exam._id.toString(),
        title: exam.title,
        titleBn: exam.titleBn,
        timeLimitMinutes: exam.timeLimitMinutes,
        totalMarks: exam.totalMarks,
        instructions: exam.instructions,
      },
      questions: sanitizedQuestions,
    };
  }

  private evaluateAnswer(question: any, submittedAnswer: any): boolean {
    if (submittedAnswer === null || submittedAnswer === undefined) {
      return false;
    }

    const trimmedSubmission = String(submittedAnswer).trim().toLowerCase();

    // 1. Check correctOptionIds (e.g. "option_0", "0", option text)
    if (Array.isArray(question.correctOptionIds) && question.correctOptionIds.length > 0) {
      const matchesOptionId = question.correctOptionIds.some(
        (optId: string) => String(optId).trim().toLowerCase() === trimmedSubmission,
      );
      if (matchesOptionId) {
        return true;
      }
    }

    // 2. Check acceptedAnswers
    if (Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0) {
      const matchesAccepted = question.acceptedAnswers.some(
        (accepted: string) => String(accepted).trim().toLowerCase() === trimmedSubmission,
      );
      if (matchesAccepted) {
        return true;
      }
    }

    // 3. Check option index match (e.g. index 0 corresponds to option text)
    const numericIndex = Number(trimmedSubmission);
    if (!isNaN(numericIndex) && Array.isArray(question.options) && question.options[numericIndex]) {
      const optionText = String(question.options[numericIndex]).trim().toLowerCase();
      if (
        question.acceptedAnswers?.some(
          (acc: string) => String(acc).trim().toLowerCase() === optionText,
        )
      ) {
        return true;
      }
    }

    return false;
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
