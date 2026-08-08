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

const isMock = ENV.useMockApi;

export const authRepository: IAuthRepository = isMock ? mockAuth : new ApiAuthRepository();
export const subjectRepository: ISubjectRepository = isMock ? mockSubject : new ApiSubjectRepository();
export const chapterRepository: IChapterRepository = isMock ? mockChapter : new ApiChapterRepository();
export const lessonRepository: ILessonRepository = isMock ? mockLesson : new ApiLessonRepository();
export const tutorRepository: ITutorRepository = isMock ? mockTutor : new ApiTutorRepository();
export const practiceRepository: IPracticeRepository = isMock ? mockPractice : (mockPractice as any);
export const examRepository: IExamRepository = isMock ? mockExam : (mockExam as any);
export const homeworkRepository: IHomeworkRepository = isMock ? mockHomework : (mockHomework as any);
export const studyPlanRepository: IStudyPlanRepository = isMock ? mockStudyPlan : (mockStudyPlan as any);
export const progressRepository: IProgressRepository = isMock ? mockProgress : (mockProgress as any);
