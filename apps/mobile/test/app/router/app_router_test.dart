import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/router/app_router.dart';
import 'package:mobile/features/auth/domain/entities/user.dart';
import 'package:mobile/features/auth/presentation/state/auth_state.dart';

void main() {
  group('App router redirect', () {
    test('routes unauthenticated users away from splash to login', () {
      expect(
        resolveAppRedirect(
          authState: const Unauthenticated(),
          location: '/splash',
        ),
        '/login',
      );
    });

    test('routes parent users to parent dashboard', () {
      expect(
        resolveAppRedirect(
          authState: const Authenticated(
            User(
              id: 'user-1',
              name: 'Parent User',
              role: UserRole.parent,
            ),
          ),
          location: '/login',
        ),
        '/parent-dashboard',
      );
    });

    test('keeps student users on home when they hit parent dashboard', () {
      expect(
        resolveAppRedirect(
          authState: const Authenticated(
            User(
              id: 'user-2',
              name: 'Student User',
              role: UserRole.student,
            ),
          ),
          location: '/parent-dashboard',
        ),
        '/home',
      );
    });

    test('shows splash while auth state is still loading', () {
      expect(
        resolveAppRedirect(
          authState: const AuthLoading(),
          location: '/home',
        ),
        '/splash',
      );
    });
  });
}
