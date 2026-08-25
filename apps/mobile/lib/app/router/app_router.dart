import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/entities/user.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/auth/presentation/state/auth_state.dart';
import 'app_routes.dart';
import 'auth_routes.dart';
import 'learning_routes.dart';
import 'assessment_routes.dart';
import 'tutor_routes.dart';
import 'parent_routes.dart';

export 'app_routes.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _GoRouterRefreshNotifier();
  ref.listen<AuthState>(
    authControllerProvider,
    (_, __) => refreshNotifier.refresh(),
  );
  ref.onDispose(refreshNotifier.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refreshNotifier,
    redirect: (context, state) => resolveAppRedirect(
      authState: ref.read(authControllerProvider),
      location: state.matchedLocation,
    ),
    routes: [
      ...authRoutes,
      ...learningRoutes,
      ...assessmentRoutes,
      ...tutorRoutes,
      ...parentRoutes,
    ],
  );
});

String? resolveAppRedirect({
  required AuthState authState,
  required String location,
}) {
  final isPublicRoute = _publicRoutes.contains(location);

  switch (authState) {
    case AuthInitial():
    case AuthLoading():
      return location == AppRoutes.splash ? null : AppRoutes.splash;
    case Authenticated(:final user):
      final home = _homeForRole(user.role);
      if (location == '/' || location == AppRoutes.splash || isPublicRoute) {
        return home;
      }

      if (location == AppRoutes.parentDashboard &&
          user.role != UserRole.parent) {
        return home;
      }

      if (location == AppRoutes.home && user.role == UserRole.parent) {
        return AppRoutes.parentDashboard;
      }

      return null;
    case OtpSentState():
      return AppRoutes.verifyOtp;
    case PasswordResetSentState():
      return AppRoutes.forgotPassword;
    case AuthFailureState():
      return isPublicRoute ? null : AppRoutes.login;
    case Unauthenticated():
      if (location == AppRoutes.splash) {
        return AppRoutes.login;
      }

      return isPublicRoute ? null : AppRoutes.login;
  }
}

String _homeForRole(UserRole role) {
  if (role == UserRole.parent) {
    return AppRoutes.parentDashboard;
  }

  return AppRoutes.home;
}

const Set<String> _publicRoutes = {
  AppRoutes.splash,
  AppRoutes.onboarding1,
  AppRoutes.onboarding2,
  AppRoutes.onboarding3,
  AppRoutes.roleSelection,
  AppRoutes.login,
  AppRoutes.signup,
  AppRoutes.verifyOtp,
  AppRoutes.forgotPassword,
};

class _GoRouterRefreshNotifier extends ChangeNotifier {
  void refresh() {
    notifyListeners();
  }
}
