import { Subject, Chapter, Lesson, TutorMessage, ProgressSummary } from '../../types';
import { LoginParams, SignupParams } from '../authRepository';
import { PracticeSession, PracticeResultData } from '../practiceRepository';
import { ExamDetails, ExamResult } from '../examRepository';
import { HomeworkDetectionResult } from '../homeworkRepository';
import { StudyPlanData } from '../studyPlanRepository';
import { StudentProfile } from '../../../store/useAuthStore';

export interface IAuthRepository {
  login(params: LoginParams): Promise<{ token: string; user: StudentProfile }>;
  signup(params: SignupParams): Promise<{ tempToken: string }>;
  verifyOTP(otp: string): Promise<{ token: string; user: StudentProfile }>;
  updateProfile(updates: Partial<StudentProfile>): Promise<StudentProfile>;
}

export interface ISubjectRepository {
  getSubjects(classId?: string): Promise<Subject[]>;
  getSubjectById(subjectId: string): Promise<Subject | null>;
}

export interface IChapterRepository {
  getChaptersBySubject(subjectId: string): Promise<Chapter[]>;
  getChapterById(chapterId: string): Promise<Chapter | null>;
}

export interface ILessonRepository {
  getLessonById(lessonId: string): Promise<Lesson>;
}

export interface ITutorRepository {
  getConversationHistory(topicId?: string): Promise<TutorMessage[]>;
  sendMessage(
    userText: string,
    onChunk?: (partialText: string) => void,
    signal?: AbortSignal
  ): Promise<TutorMessage>;
}

export interface IPracticeRepository {
  getPracticeSession(topicId?: string, questionCount?: number): Promise<PracticeSession>;
  submitPracticeResults(
    sessionId: string,
    answers: Record<string, string>,
    timeSpentSeconds: number
  ): Promise<PracticeResultData>;
}

export interface IExamRepository {
  getExamDetails(examId?: string): Promise<ExamDetails>;
  submitExam(examId: string, answers: Record<string, string>): Promise<ExamResult>;
}

export interface IHomeworkRepository {
  analyzeHomeworkImage(imageUri: string): Promise<HomeworkDetectionResult>;
}

export interface IStudyPlanRepository {
  getDailyStudyPlan(studentId?: string): Promise<StudyPlanData>;
  toggleTaskCompletion(taskId: string): Promise<StudyPlanData>;
}

export interface IProgressRepository {
  getProgressSummary(studentId?: string): Promise<ProgressSummary>;
}
