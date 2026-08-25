import 'package:go_router/go_router.dart';
import '../../features/auth/domain/entities/user.dart';
import '../../features/auth/domain/entities/otp_purpose.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/role_selection_page.dart';
import '../../features/auth/presentation/pages/signup_page.dart';
import '../../features/auth/presentation/pages/verify_otp_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_1_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_2_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_3_page.dart';
import '../../features/onboarding/presentation/pages/splash_page.dart';
import '../../features/setup/presentation/pages/class_selection_page.dart';
import '../../features/setup/presentation/pages/curriculum_selection_page.dart';
import '../../features/setup/presentation/pages/goal_setting_page.dart';
import 'app_routes.dart';

final List<RouteBase> authRoutes = [
  GoRoute(
    path: AppRoutes.splash,
    builder: (context, state) => const SplashPage(),
  ),
  GoRoute(
    path: AppRoutes.onboarding1,
    builder: (context, state) => const Onboarding1Page(),
  ),
  GoRoute(
    path: AppRoutes.onboarding2,
    builder: (context, state) => const Onboarding2Page(),
  ),
  GoRoute(
    path: AppRoutes.onboarding3,
    builder: (context, state) => const Onboarding3Page(),
  ),
  GoRoute(
    path: AppRoutes.roleSelection,
    builder: (context, state) => const RoleSelectionPage(),
  ),
  GoRoute(
    path: AppRoutes.login,
    builder: (context, state) => const LoginPage(),
  ),
  GoRoute(
    path: AppRoutes.signup,
    builder: (context, state) => SignupPage(
      initialRole: state.uri.queryParameters['role'] == 'parent'
          ? UserRole.parent
          : UserRole.student,
    ),
  ),
  GoRoute(
    path: AppRoutes.verifyOtp,
    builder: (context, state) => VerifyOtpPage(
      phone: state.uri.queryParameters['identifier'] ??
          state.uri.queryParameters['phone'] ??
          '',
      purpose: state.uri.queryParameters['purpose'] == 'password_reset'
          ? OtpPurpose.passwordReset
          : OtpPurpose.registration,
    ),
  ),
  GoRoute(
    path: AppRoutes.forgotPassword,
    builder: (context, state) => const ForgotPasswordPage(),
  ),
  GoRoute(
    path: AppRoutes.classSelection,
    builder: (context, state) => const ClassSelectionPage(),
  ),
  GoRoute(
    path: AppRoutes.curriculumSelection,
    builder: (context, state) => const CurriculumSelectionPage(),
  ),
  GoRoute(
    path: AppRoutes.goalSetting,
    builder: (context, state) => const GoalSettingPage(),
  ),
];
