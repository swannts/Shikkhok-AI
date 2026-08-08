export const queryKeys = {
  auth: {
    studentProfile: () => ['auth', 'profile'] as const,
  },
  subjects: {
    all: (classId: string) => ['subjects', classId] as const,
    detail: (subjectId: string) => ['subjects', 'detail', subjectId] as const,
  },
  chapters: {
    bySubject: (subjectId: string) => ['chapters', 'subject', subjectId] as const,
    detail: (chapterId: string) => ['chapters', 'detail', chapterId] as const,
  },
  lessons: {
    detail: (lessonId: string) => ['lessons', 'detail', lessonId] as const,
  },
  tutor: {
    history: (topicId?: string) => ['tutor', 'history', topicId || 'global'] as const,
  },
  practice: {
    session: (topicId?: string) => ['practice', 'session', topicId || 'default'] as const,
  },
  exams: {
    detail: (examId: string) => ['exams', 'detail', examId] as const,
  },
  progress: {
    summary: (studentId: string) => ['progress', 'summary', studentId] as const,
  },
  studyPlan: {
    daily: (studentId: string) => ['studyPlan', 'daily', studentId] as const,
  },
};
