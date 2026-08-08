export interface Subject {
  id: string;
  bnName: string;
  enName: string;
  icon: string;
  chapterCount: number;
  lessonCount: number;
  progress: number;
  colorBg: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  chapterNumber: number;
  bnTitle: string;
  enTitle: string;
  lessonCount: number;
  practiceSetCount: number;
  progress: number;
}

export interface LessonContentBlock {
  type: 'explanation' | 'importantNote' | 'example' | 'formula' | 'inlineQuiz';
  title?: string;
  body: string;
  formulaText?: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  estimatedMinutes: number;
  progress: number;
  blocks: LessonContentBlock[];
}

export interface TutorMessage {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  createdAt: string;
  actions?: { label: string; actionKey: string }[];
}

export interface ProgressSummary {
  overallMastery: number; // 0-100
  studyTimeHours: number;
  accuracyRate: number;
  needsAttention: { topic: string; mastery: number }[];
  subjectMastery: { subject: string; mastery: number }[];
}
