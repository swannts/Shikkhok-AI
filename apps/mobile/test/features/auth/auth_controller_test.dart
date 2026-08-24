import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_failure.dart';
import 'package:mobile/features/auth/domain/entities/user.dart';
import 'package:mobile/features/auth/domain/entities/token_pair.dart';
import 'package:mobile/features/auth/domain/entities/otp_purpose.dart';
import 'package:mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:mobile/features/auth/presentation/state/auth_state.dart';

class FakeAuthRepository implements AuthRepository {
  bool shouldFail = false;

  final testUser = const User(
    id: 'user-999',
    name: 'ফারহান করিম',
    phone: '01911223344',
    role: UserRole.student,
  );

  @override
  Future<User> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) async {
    if (shouldFail) {
      throw const UnauthorizedFailure(
        message: 'Invalid credentials',
        banglaMessage: 'লগইন তথ্য সঠিক নয়।',
      );
    }
    return testUser;
  }

  @override
  Future<User> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    UserRole? role,
  }) async {
    if (shouldFail) {
      throw const ConflictFailure(
        message: 'User already exists',
        banglaMessage: 'এই নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে।',
      );
    }
    return testUser;
  }

  @override
  Future<User> getCurrentUser() async {
    if (shouldFail) throw const UnauthorizedFailure();
    return testUser;
  }

  @override
  Future<TokenPair> refreshTokens({required String refreshToken}) async {
    if (shouldFail) throw const UnauthorizedFailure();
    return const TokenPair(
      accessToken: 'refreshed-acc',
      refreshToken: 'refreshed-ref',
    );
  }

  @override
  Future<void> logout() async {}

  @override
  Future<void> logoutAll() async {}

  @override
  Future<String> requestOtp({
    required String phone,
    required OtpPurpose purpose,
  }) async {
    if (shouldFail) throw const RateLimitFailure();
    return 'OTP code sent';
  }

  @override
  Future<String> verifyOtp({
    required String phone,
    required String otp,
    required OtpPurpose purpose,
  }) async {
    if (shouldFail) {
      throw const ValidationFailure(
        message: 'Invalid OTP',
        banglaMessage: 'ভুল ওটিপি কোড।',
      );
    }
    return 'OTP verified';
  }

  @override
  Future<String> forgotPassword({required String identifier}) async {
    return 'Instructions sent';
  }

  @override
  Future<String> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    return 'Password reset';
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AuthController Unit Tests', () {
    late FakeAuthRepository fakeRepo;
    late AuthController controller;

    setUp(() {
      fakeRepo = FakeAuthRepository();
      controller = AuthController(fakeRepo);
    });

    test('Initial state is AuthInitial', () {
      expect(controller.state, isA<AuthInitial>());
    });

    test('login success transitions state to Authenticated', () async {
      final success = await controller.login(
        identifier: '01911223344',
        password: 'password123',
      );

      expect(success, isTrue);
      expect(controller.state, isA<Authenticated>());
      final authState = controller.state as Authenticated;
      expect(authState.user.name, 'ফারহান করিম');
    });

    test('login failure transitions state to AuthFailureState', () async {
      fakeRepo.shouldFail = true;

      final success = await controller.login(
        identifier: '01911223344',
        password: 'wrongpassword',
      );

      expect(success, isFalse);
      expect(controller.state, isA<AuthFailureState>());
      final failureState = controller.state as AuthFailureState;
      expect(failureState.failure.banglaMessage, 'লগইন তথ্য সঠিক নয়।');
    });

    test('register success transitions state to Authenticated', () async {
      final success = await controller.register(
        name: 'ফারহান করিম',
        phone: '01911223344',
        password: 'SecurePassword123',
      );

      expect(success, isTrue);
      expect(controller.state, isA<Authenticated>());
    });

    test('requestOtp transitions state to OtpSentState', () async {
      final success = await controller.requestOtp(
        phone: '01911223344',
        purpose: OtpPurpose.registration,
      );

      expect(success, isTrue);
      expect(controller.state, isA<OtpSentState>());
      final otpState = controller.state as OtpSentState;
      expect(otpState.phone, '01911223344');
      expect(otpState.purpose, OtpPurpose.registration);
    });

    test('logout transitions state to Unauthenticated', () async {
      await controller.logout();
      expect(controller.state, isA<Unauthenticated>());
    });
  });
}
