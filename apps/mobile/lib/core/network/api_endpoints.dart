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
  static const String studentProfile = '/students/profile';

  // Notifications
  static const String notifications = '/notifications/me';
  static const String notificationsUnreadCount = '/notifications/me/unread-count';
  static const String notificationsMarkAllRead = '/notifications/me/read-all';
  static String notificationMarkRead(String notificationId) =>
      '/notifications/me/$notificationId/read';

  // Tutor
  static const String tutorConversations = '/tutor/me/conversations';
  static String tutorConversation(String conversationId) =>
      '/tutor/me/conversations/$conversationId';
  static String tutorConversationMessages(String conversationId) =>
      '/tutor/me/conversations/$conversationId/messages';
  static String tutorConversationStream(String conversationId) =>
      '/tutor/me/conversations/$conversationId/messages/stream';

  // Study Plan
  static const String studyPlanCurrent = '/study-plan/me/current';
  static const String studyPlanGenerate = '/study-plan/me/generate';

  // Health
  static const String healthLive = '/health/live';
  static const String healthReady = '/health/ready';
}
