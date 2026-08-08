import { ENV } from '../../config/env';
import {
  IAuthRepository,
  ISubjectRepository,
  IChapterRepository,
  ILessonRepository,
  ITutorRepository,
  IPracticeRepository,
  IExamRepository,
  IHomeworkRepository,
  IStudyPlanRepository,
  IProgressRepository,
} from './interfaces/IRepositories';

// Import Mock Implementations
import { authRepository as mockAuth } from './authRepository';
import { subjectRepository as mockSubject } from './subjectRepository';
import { chapterRepository as mockChapter } from './chapterRepository';
import { lessonRepository as mockLesson } from './lessonRepository';
import { tutorRepository as mockTutor } from './tutorRepository';
import { practiceRepository as mockPractice } from './practiceRepository';
import { examRepository as mockExam } from './examRepository';
import { homeworkRepository as mockHomework } from './homeworkRepository';
import { studyPlanRepository as mockStudyPlan } from './studyPlanRepository';
import { progressRepository as mockProgress } from './progressRepository';

// Import API Implementations
import { ApiAuthRepository } from './api/ApiAuthRepository';
import { ApiSubjectRepository } from './api/ApiSubjectRepository';
import { ApiChapterRepository } from './api/ApiChapterRepository';
import { ApiLessonRepository } from './api/ApiLessonRepository';
import { ApiTutorRepository } from './api/ApiTutorRepository';
import { PracticeSession, PracticeResultData } from './practiceRepository';
import { ExamDetails, ExamResult } from './examRepository';
import { HomeworkDetectionResult } from './homeworkRepository';
import { StudyPlanData } from './studyPlanRepository';
import { ProgressSummary } from '../types';
import { httpClient } from '../httpClient';

class ApiPracticeRepository implements IPracticeRepository {
  async getPracticeSession(topicId?: string, questionCount?: number): Promise<PracticeSession> {
    return httpClient.get<PracticeSession>(
      `/practice/session?topicId=${topicId || 'default'}&count=${questionCount || 5}`
    );
  }
  async submitPracticeResults(
    sessionId: string,
    answers: Record<string, string>,
    timeSpentSeconds: number
  ): Promise<PracticeResultData> {
    return httpClient.post<PracticeResultData>('/practice/submit', {
      sessionId,
      answers,
      timeSpentSeconds,
    });
  }
}

class ApiExamRepository implements IExamRepository {
  async getExamDetails(examId?: string): Promise<ExamDetails> {
    return httpClient.get<ExamDetails>(`/exams/${examId || 'model-test-1'}`);
  }
  async submitExam(examId: string, answers: Record<string, string>): Promise<ExamResult> {
    return httpClient.post<ExamResult>(`/exams/${examId}/submit`, { answers });
  }
}

class ApiHomeworkRepository implements IHomeworkRepository {
  async analyzeHomeworkImage(imageUri: string): Promise<HomeworkDetectionResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'homework.jpg',
    } as unknown as Blob);

    return httpClient.post<HomeworkDetectionResult>('/homework/upload-and-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
}

class ApiStudyPlanRepository implements IStudyPlanRepository {
  async getDailyStudyPlan(studentId?: string): Promise<StudyPlanData> {
    return httpClient.get<StudyPlanData>(`/study-plan/daily?studentId=${studentId || 'student-1'}`);
  }
  async toggleTaskCompletion(taskId: string): Promise<StudyPlanData> {
    return httpClient.post<StudyPlanData>(`/study-plan/tasks/${taskId}/toggle`);
  }
}

class ApiProgressRepository implements IProgressRepository {
  async getProgressSummary(studentId?: string): Promise<ProgressSummary> {
    return httpClient.get<ProgressSummary>(
      `/progress/summary?studentId=${studentId || 'student-1'}`
    );
  }
}

const isMock = ENV.useMockApi;

export const authRepository: IAuthRepository = isMock ? mockAuth : new ApiAuthRepository();
export const subjectRepository: ISubjectRepository = isMock
  ? mockSubject
  : new ApiSubjectRepository();
export const chapterRepository: IChapterRepository = isMock
  ? mockChapter
  : new ApiChapterRepository();
export const lessonRepository: ILessonRepository = isMock ? mockLesson : new ApiLessonRepository();
export const tutorRepository: ITutorRepository = isMock ? mockTutor : new ApiTutorRepository();
export const practiceRepository: IPracticeRepository = isMock
  ? mockPractice
  : new ApiPracticeRepository();
export const examRepository: IExamRepository = isMock ? mockExam : new ApiExamRepository();
export const homeworkRepository: IHomeworkRepository = isMock
  ? mockHomework
  : new ApiHomeworkRepository();
export const studyPlanRepository: IStudyPlanRepository = isMock
  ? mockStudyPlan
  : new ApiStudyPlanRepository();
export const progressRepository: IProgressRepository = isMock
  ? mockProgress
  : new ApiProgressRepository();
