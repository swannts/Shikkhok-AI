abstract final class AppRoutes {
  // Static Top-Level Routes
  static const splash = '/splash';
  static const onboarding1 = '/onboarding-1';
  static const onboarding2 = '/onboarding-2';
  static const onboarding3 = '/onboarding-3';
  static const roleSelection = '/role-selection';
  static const login = '/login';
  static const signup = '/signup';
  static const verifyOtp = '/verify-otp';
  static const forgotPassword = '/forgot-password';
  static const classSelection = '/class-selection';
  static const curriculumSelection = '/curriculum-selection';
  static const goalSetting = '/goal-setting';
  static const home = '/home';
  static const learn = '/learn';
  static const notifications = '/notifications';
  static const globalSearch = '/global-search';
  static const studentProfile = '/student-profile';
  static const studentAchievements = '/student-achievements';
  static const settings = '/settings';
  static const helpSupport = '/help-support';
  static const parentDashboard = '/parent-dashboard';
  static const subscription = '/subscription';
  static const checkout = '/checkout';
  static const paymentSuccess = '/payment-success';
  static const offlineDownloads = '/offline-downloads';
  static const textbookLibrary = '/textbook-library';
  static const todaysStudyPlan = '/todays-study-plan';
  static const studyCalendar = '/study-calendar';
  static const mathProgressDetail = '/math-progress-detail';
  static const studentProgressDashboard = '/student-progress-dashboard';
  static const weeklyLearningReport = '/weekly-learning-report';
  static const homeworkHelpLanding = '/homework-help-landing';
  static const homeworkHelp = '/homework-help';
  static const capturedHomeworkReview = '/captured-homework-review';
  static const homeworkAiSolution = '/homework-ai-solution';
  static const sourceCitation = '/source-citation';
  static const examLibrary = '/exam-library';
  static const examInstructions = '/exam-instructions';
  static const examSession = '/exam-session';
  static const examResult = '/exam-result';
  static const practiceSetup = '/practice-setup';
  static const practiceSessionMcq = '/practice-session-mcq';
  static const practiceResult = '/practice-result';
  static const practiceMistakeReview = '/practice-mistake-review';
  static const aiTutorChat = '/ai-tutor-chat';
  static const aiTutorHistory = '/ai-tutor-history';
  static const voiceAiTutor = '/voice-ai-tutor';

  // Dynamic Parameterized Routes
  static String subject(String subjectId) => '/subjects/$subjectId';
  static String chapter(String chapterId) => '/chapters/$chapterId';
  static String lesson(String lessonId) => '/lessons/$lessonId';
  static String textbook(String bookId) => '/textbooks/$bookId';
  static String tutor(String conversationId) => '/tutor/$conversationId';
  static String examDetails(String examId) => '/exams/$examId';
  static String examSessionWithId(String examId, String sessionId) =>
      '/exams/$examId/session/$sessionId';
  static String homeworkSubmission(String submissionId) =>
      '/homework/$submissionId';
}
