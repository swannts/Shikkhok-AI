class ApiEndpoints {
  // Authentication
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String logoutAll = '/auth/logout-all';
  static const String me = '/auth/me';
  static const String requestOtp = '/auth/otp/request';
  static const String verifyOtp = '/auth/otp/verify';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Students & Profile
  static const String studentsMe = '/students/me';
  static String studentByUserId(String userId) => '/students/$userId';

  // Curriculum
  static const String curriculumSubjects = '/curriculum/subjects';
  static String curriculumSubject(String subjectId) =>
      '/curriculum/subjects/$subjectId';
  static String curriculumChapters(String subjectId) =>
      '/curriculum/subjects/$subjectId/chapters';
  static String curriculumChapter(String chapterId) =>
      '/curriculum/chapters/$chapterId';
  static String curriculumLessons(String chapterId) =>
      '/curriculum/chapters/$chapterId/lessons';
  static String curriculumLesson(String lessonId) =>
      '/curriculum/lessons/$lessonId';

  // Progress
  static const String progressSummary = '/progress/me/summary';
  static String progressSubject(String subjectId) =>
      '/progress/me/subjects/$subjectId';
  static String progressLesson(String lessonId) =>
      '/progress/me/lessons/$lessonId';

  // Practice & Question Bank
  static String practiceLessonQuestions(String lessonId) =>
      '/practice/lessons/$lessonId/questions';
  static const String practiceSubmit = '/practice/submit';
  static const String practiceMyAttempts = '/practice/me/attempts';

  // Exams & Assessment
  static const String exams = '/exams';
  static String exam(String examId) => '/exams/$examId';
  static String examStart(String examId) => '/exams/$examId/start';
  static String examSession(String sessionId) => '/exams/sessions/$sessionId';
  static String examSessionAnswer(String sessionId, String questionId) =>
      '/exams/sessions/$sessionId/answers/$questionId';
  static String examSessionFlag(String sessionId, String questionId) =>
      '/exams/sessions/$sessionId/flag/$questionId';
  static String examSessionSubmit(String sessionId) =>
      '/exams/sessions/$sessionId/submit';
  static String examSessionResult(String sessionId) =>
      '/exams/sessions/$sessionId/result';
  static String examSessionReview(String sessionId) =>
      '/exams/sessions/$sessionId/review';

  // Study Plan
  static const String studyPlanCurrent = '/study-plan/me/current';
  static const String studyPlanHistory = '/study-plan/me/history';
  static const String studyPlanGenerate = '/study-plan/me/generate';

  // Gamification
  static const String gamificationSummary = '/gamification/me/summary';
  static const String gamificationAchievements =
      '/gamification/me/achievements';
  static const String gamificationRecordStreak =
      '/gamification/me/streak/record';
  static const String gamificationLeaderboard = '/gamification/leaderboard';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsUnreadCount = '/notifications/unread-count';
  static const String notificationsMarkAllRead = '/notifications/read-all';
  static String notificationMarkRead(String id) => '/notifications/$id/read';

  // AI Tutor
  static const String tutorConversations = '/tutor/me/conversations';
  static String tutorConversation(String id) => '/tutor/me/conversations/$id';
  static String tutorConversationMessages(String id) =>
      '/tutor/me/conversations/$id/messages';
  static String tutorStreamMessage(String id) =>
      '/tutor/me/conversations/$id/messages/stream';

  // Health
  static const String healthLive = '/health/live';
  static const String healthReady = '/health/ready';
}
