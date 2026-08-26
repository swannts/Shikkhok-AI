import 'package:go_router/go_router.dart';
import '../../features/analytics/presentation/pages/math_progress_detail_page.dart';
import '../../features/analytics/presentation/pages/student_progress_dashboard_page.dart';
import '../../features/analytics/presentation/pages/weekly_learning_report_page.dart';
import '../../features/curriculum/presentation/pages/chapter_details_page.dart';
import '../../features/curriculum/presentation/pages/learn_page.dart';
import '../../features/curriculum/presentation/pages/lesson_reader_page.dart';
import '../../features/curriculum/presentation/pages/offline_downloads_page.dart';
import '../../features/curriculum/presentation/pages/source_citation_page.dart';
import '../../features/curriculum/presentation/pages/study_calendar_page.dart';
import '../../features/curriculum/presentation/pages/subject_details_page.dart';
import '../../features/curriculum/presentation/pages/textbook_library_page.dart';
import '../../features/curriculum/presentation/pages/textbook_reader_page.dart';
import '../../features/curriculum/presentation/pages/todays_study_plan_page.dart';
import '../../features/home/presentation/pages/global_search_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/home/presentation/pages/notifications_page.dart';
import '../../features/profile/presentation/pages/student_achievements_page.dart';
import '../../features/profile/presentation/pages/student_profile_page.dart';
import '../../features/settings/presentation/pages/help_support_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import 'app_routes.dart';

final List<RouteBase> learningRoutes = [
  GoRoute(
    path: AppRoutes.home,
    builder: (context, state) => const HomePage(),
  ),
  GoRoute(
    path: AppRoutes.learn,
    builder: (context, state) => const LearnPage(),
  ),
  GoRoute(
    path: AppRoutes.notifications,
    builder: (context, state) => const NotificationsPage(),
  ),
  GoRoute(
    path: AppRoutes.globalSearch,
    builder: (context, state) => const GlobalSearchPage(),
  ),
  GoRoute(
    path: '/subject-details',
    builder: (context, state) => const SubjectDetailsPage(),
  ),
  GoRoute(
    path: '/subjects/:subjectId',
    builder: (context, state) => SubjectDetailsPage(
      subjectId: state.pathParameters['subjectId'],
    ),
  ),
  GoRoute(
    path: '/chapter-details',
    builder: (context, state) => const ChapterDetailsPage(),
  ),
  GoRoute(
    path: '/chapters/:chapterId',
    builder: (context, state) => ChapterDetailsPage(
      chapterId: state.pathParameters['chapterId'],
    ),
  ),
  GoRoute(
    path: '/lesson-reader',
    builder: (context, state) => const LessonReaderPage(),
  ),
  GoRoute(
    path: '/lessons/:lessonId',
    builder: (context, state) => LessonReaderPage(
      lessonId: state.pathParameters['lessonId'],
    ),
  ),
  GoRoute(
    path: AppRoutes.textbookLibrary,
    builder: (context, state) => const TextbookLibraryPage(),
  ),
  GoRoute(
    path: '/textbook-reader',
    builder: (context, state) => const TextbookReaderPage(),
  ),
  GoRoute(
    path: '/textbooks/:bookId',
    builder: (context, state) => TextbookReaderPage(
      bookId: state.pathParameters['bookId'],
    ),
  ),
  GoRoute(
    path: AppRoutes.todaysStudyPlan,
    builder: (context, state) => const TodaysStudyPlanPage(),
  ),
  GoRoute(
    path: AppRoutes.studyCalendar,
    builder: (context, state) => const StudyCalendarPage(),
  ),
  GoRoute(
    path: AppRoutes.mathProgressDetail,
    builder: (context, state) => const MathProgressDetailPage(),
  ),
  GoRoute(
    path: AppRoutes.studentProgressDashboard,
    builder: (context, state) => const StudentProgressDashboardPage(),
  ),
  GoRoute(
    path: AppRoutes.weeklyLearningReport,
    builder: (context, state) => const WeeklyLearningReportPage(),
  ),
  GoRoute(
    path: AppRoutes.sourceCitation,
    builder: (context, state) => const SourceCitationPage(),
  ),
  GoRoute(
    path: AppRoutes.studentProfile,
    builder: (context, state) => const StudentProfilePage(),
  ),
  GoRoute(
    path: AppRoutes.studentAchievements,
    builder: (context, state) => const StudentAchievementsPage(),
  ),
  GoRoute(
    path: AppRoutes.settings,
    builder: (context, state) => const SettingsPage(),
  ),
  GoRoute(
    path: AppRoutes.helpSupport,
    builder: (context, state) => const HelpSupportPage(),
  ),
  GoRoute(
    path: AppRoutes.offlineDownloads,
    builder: (context, state) => const OfflineDownloadsPage(),
  ),
];
