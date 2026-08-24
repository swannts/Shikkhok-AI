import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/role_selection_page.dart';
import '../../features/auth/presentation/pages/signup_page.dart';
import '../../features/auth/presentation/pages/verify_otp_page.dart';
import '../../features/curriculum/presentation/pages/chapter_details_page.dart';
import '../../features/curriculum/presentation/pages/learn_page.dart';
import '../../features/curriculum/presentation/pages/lesson_reader_page.dart';
import '../../features/curriculum/presentation/pages/practice_mistake_review_page.dart';
import '../../features/curriculum/presentation/pages/practice_result_page.dart';
import '../../features/curriculum/presentation/pages/practice_session_mcq_page.dart';
import '../../features/curriculum/presentation/pages/practice_setup_page.dart';
import '../../features/curriculum/presentation/pages/subject_details_page.dart';
import '../../features/exam/presentation/pages/exam_library_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/homework/presentation/pages/captured_homework_review_page.dart';
import '../../features/homework/presentation/pages/homework_ai_solution_page.dart';
import '../../features/homework/presentation/pages/homework_help_landing_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_1_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_2_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_3_page.dart';
import '../../features/onboarding/presentation/pages/splash_page.dart';
import '../../features/setup/presentation/pages/class_selection_page.dart';
import '../../features/setup/presentation/pages/curriculum_selection_page.dart';
import '../../features/setup/presentation/pages/goal_setting_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_chat_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_chat_variant_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_history_empty_page.dart';
import '../../features/tutor/presentation/pages/ai_tutor_history_page.dart';
import '../../features/tutor/presentation/pages/voice_ai_tutor_page.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashPage(),
    ),
    GoRoute(
      path: '/onboarding-1',
      builder: (context, state) => const Onboarding1Page(),
    ),
    GoRoute(
      path: '/onboarding-2',
      builder: (context, state) => const Onboarding2Page(),
    ),
    GoRoute(
      path: '/onboarding-3',
      builder: (context, state) => const Onboarding3Page(),
    ),
    GoRoute(
      path: '/role-selection',
      builder: (context, state) => const RoleSelectionPage(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignupPage(),
    ),
    GoRoute(
      path: '/verify-otp',
      builder: (context, state) => const VerifyOtpPage(),
    ),
    GoRoute(
      path: '/class-selection',
      builder: (context, state) => const ClassSelectionPage(),
    ),
    GoRoute(
      path: '/curriculum-selection',
      builder: (context, state) => const CurriculumSelectionPage(),
    ),
    GoRoute(
      path: '/goal-setting',
      builder: (context, state) => const GoalSettingPage(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/learn',
      builder: (context, state) => const LearnPage(),
    ),
    GoRoute(
      path: '/subject-details',
      builder: (context, state) => const SubjectDetailsPage(),
    ),
    GoRoute(
      path: '/chapter-details',
      builder: (context, state) => const ChapterDetailsPage(),
    ),
    GoRoute(
      path: '/lesson-reader',
      builder: (context, state) => const LessonReaderPage(),
    ),
    GoRoute(
      path: '/ai-tutor-chat',
      builder: (context, state) => const AiTutorChatPage(),
    ),
    GoRoute(
      path: '/ai-tutor-chat-variant',
      builder: (context, state) => const AiTutorChatVariantPage(),
    ),
    GoRoute(
      path: '/voice-ai-tutor',
      builder: (context, state) => const VoiceAiTutorPage(),
    ),
    GoRoute(
      path: '/ai-tutor-history',
      builder: (context, state) => const AiTutorHistoryPage(),
    ),
    GoRoute(
      path: '/ai-tutor-history-empty',
      builder: (context, state) => const AiTutorHistoryEmptyPage(),
    ),
    GoRoute(
      path: '/homework-help',
      builder: (context, state) => const HomeworkHelpLandingPage(),
    ),
    GoRoute(
      path: '/captured-homework-review',
      builder: (context, state) => const CapturedHomeworkReviewPage(),
    ),
    GoRoute(
      path: '/homework-ai-solution',
      builder: (context, state) => const HomeworkAiSolutionPage(),
    ),
    GoRoute(
      path: '/practice-setup',
      builder: (context, state) => const PracticeSetupPage(),
    ),
    GoRoute(
      path: '/practice-session-mcq',
      builder: (context, state) => const PracticeSessionMcqPage(),
    ),
    GoRoute(
      path: '/practice-result',
      builder: (context, state) => const PracticeResultPage(),
    ),
    GoRoute(
      path: '/practice-mistake-review',
      builder: (context, state) => const PracticeMistakeReviewPage(),
    ),
    GoRoute(
      path: '/exam-library',
      builder: (context, state) => const ExamLibraryPage(),
    ),
  ],
);
