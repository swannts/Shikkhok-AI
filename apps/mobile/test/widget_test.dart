import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/domain/entities/user.dart';
import 'package:mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:mobile/features/auth/presentation/state/auth_state.dart';
import 'package:mobile/core/errors/app_failure.dart';

void main() {
  test('User domain entity initialization test', () {
    const user = User(
      id: 'student-1',
      userId: 'user-1',
      name: 'রাফি আহমেদ',
      classId: 'class-8',
      className: 'Class 8',
      language: 'bn',
    );

    expect(user.name, 'রাফি আহমেদ');
    expect(user.classId, 'class-8');
  });

  test('AppFailure error hierarchy test', () {
    const failure = NetworkFailure();
    expect(failure.errorCode, 'NETWORK_ERROR');
    expect(failure.banglaMessage, contains('ইন্টারনেট'));
  });

  testWidgets('AuthController state changes test', (WidgetTester tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    expect(container.read(authControllerProvider), isA<AuthInitial>());

    await container.read(authControllerProvider.notifier).login('01711223344', 'password123');
    expect(container.read(authControllerProvider), isA<Authenticated>());
  });
}
