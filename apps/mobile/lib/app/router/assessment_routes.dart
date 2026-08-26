import 'package:go_router/go_router.dart';
import '../../features/curriculum/presentation/pages/practice_mistake_review_page.dart';
import '../../features/curriculum/presentation/pages/practice_result_page.dart';
import '../../features/curriculum/presentation/pages/practice_session_mcq_page.dart';
import '../../features/curriculum/presentation/pages/practice_setup_page.dart';
import '../../features/exam/presentation/pages/exam_instructions_page.dart';
import '../../features/exam/presentation/pages/exam_library_page.dart';
import '../../features/exam/presentation/pages/exam_result_page.dart';
import '../../features/exam/presentation/pages/exam_session_page.dart';
import '../../features/homework/presentation/pages/captured_homework_review_page.dart';
import '../../features/homework/presentation/pages/homework_ai_solution_page.dart';
import '../../features/homework/presentation/pages/homework_help_landing_page.dart';
import 'app_routes.dart';

final List<RouteBase> assessmentRoutes = [
  GoRoute(
    path: AppRoutes.examLibrary,
    builder: (context, state) => const ExamLibraryPage(),
  ),
  GoRoute(
    path: AppRoutes.examInstructions,
    builder: (context, state) => const ExamInstructionsPage(),
  ),
  GoRoute(
    path: '/exams/:examId',
    builder: (context, state) => ExamInstructionsPage(
      examId: state.pathParameters['examId'],
    ),
  ),
  GoRoute(
    path: AppRoutes.examSession,
    builder: (context, state) => const ExamSessionPage(),
  ),
  GoRoute(
    path: '/exams/:examId/session/:sessionId',
    builder: (context, state) => ExamSessionPage(
      examId: state.pathParameters['examId'],
      sessionId: state.pathParameters['sessionId'],
    ),
  ),
  GoRoute(
    path: AppRoutes.examResult,
    builder: (context, state) => const ExamResultPage(),
  ),
  GoRoute(
    path: AppRoutes.practiceSetup,
    builder: (context, state) => const PracticeSetupPage(),
  ),
  GoRoute(
    path: AppRoutes.practiceSessionMcq,
    builder: (context, state) => const PracticeSessionMcqPage(),
  ),
  GoRoute(
    path: '/practice/session/:sessionId',
    builder: (context, state) => const PracticeSessionMcqPage(),
  ),
  GoRoute(
    path: AppRoutes.practiceResult,
    builder: (context, state) => const PracticeResultPage(),
  ),
  GoRoute(
    path: AppRoutes.practiceMistakeReview,
    builder: (context, state) => const PracticeMistakeReviewPage(),
  ),
  GoRoute(
    path: AppRoutes.homeworkHelpLanding,
    builder: (context, state) => const HomeworkHelpLandingPage(),
  ),
  GoRoute(
    path: AppRoutes.homeworkHelp,
    builder: (context, state) => const HomeworkHelpLandingPage(),
  ),
  GoRoute(
    path: AppRoutes.capturedHomeworkReview,
    builder: (context, state) => const CapturedHomeworkReviewPage(),
  ),
  GoRoute(
    path: AppRoutes.homeworkAiSolution,
    builder: (context, state) => const HomeworkAiSolutionPage(),
  ),
  GoRoute(
    path: '/homework/:submissionId',
    builder: (context, state) => HomeworkAiSolutionPage(
      submissionId: state.pathParameters['submissionId'],
    ),
  ),
];
