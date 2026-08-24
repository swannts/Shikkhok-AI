import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/domain/entities/user.dart';
import 'package:mobile/features/auth/domain/entities/token_pair.dart';
import 'package:mobile/features/auth/domain/entities/otp_purpose.dart';
import 'package:mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:mobile/features/auth/presentation/state/auth_state.dart';
import 'package:mobile/core/errors/app_failure.dart';

class FakeAuthRepository implements AuthRepository {
  @override
  Future<User> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) async {
    return const User(
      id: 'student-1',
      name: 'রাফি আহমেদ',
      email: 'rafi@example.com',
      phone: '01711223344',
      role: UserRole.student,
    );
  }

  @override
  Future<User> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    UserRole? role,
  }) async {
    return User(
      id: 'student-1',
      name: name,
      email: email,
      phone: phone,
      role: role ?? UserRole.student,
    );
  }

  @override
  Future<String> verifyOtp({
    required String phone,
    required String otp,
    required OtpPurpose purpose,
  }) async {
    return 'OTP verified';
  }

  @override
  Future<String> requestOtp({
    required String phone,
    required OtpPurpose purpose,
  }) async {
    return 'OTP sent';
  }

  @override
  Future<User> getCurrentUser() async {
    return const User(
      id: 'student-1',
      name: 'রাফি আহমেদ',
      role: UserRole.student,
    );
  }

  @override
  Future<TokenPair> refreshTokens({required String refreshToken}) async {
    return const TokenPair(
      accessToken: 'refreshed-token',
      refreshToken: 'refreshed-refresh-token',
    );
  }

  @override
  Future<String> forgotPassword({required String identifier}) async {
    return 'Reset instructions sent';
  }

  @override
  Future<String> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    return 'Password reset successfully';
  }

  @override
  Future<void> logout() async {}

  @override
  Future<void> logoutAll() async {}
}

void main() {
  test('User domain entity initialization test', () {
    const user = User(
      id: 'student-1',
      name: 'রাফি আহমেদ',
      email: 'rafi@example.com',
      role: UserRole.student,
    );

    expect(user.name, 'রাফি আহমেদ');
    expect(user.role, UserRole.student);
    expect(user.isStudent, isTrue);
  });

  test('AppFailure error hierarchy test', () {
    const failure = NetworkFailure();
    expect(failure.errorCode, 'NETWORK_ERROR');
    expect(failure.banglaMessage, contains('ইন্টারনেট'));
  });

  testWidgets('AuthController state changes test with FakeAuthRepository',
      (WidgetTester tester) async {
    final container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
      ],
    );
    addTearDown(container.dispose);

    expect(container.read(authControllerProvider), isA<AuthInitial>());

    await container.read(authControllerProvider.notifier).login(
          identifier: '01711223344',
          password: 'password123',
        );
    expect(container.read(authControllerProvider), isA<Authenticated>());
  });
}
