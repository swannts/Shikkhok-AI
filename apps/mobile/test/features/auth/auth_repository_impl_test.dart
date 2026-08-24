import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:mobile/features/auth/data/dto/auth_response_dto.dart';
import 'package:mobile/features/auth/data/dto/token_pair_dto.dart';
import 'package:mobile/features/auth/data/dto/user_dto.dart';
import 'package:mobile/features/auth/data/dto/message_response_dto.dart';
import 'package:mobile/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:mobile/features/auth/domain/entities/user.dart';
import 'package:mobile/features/auth/domain/entities/otp_purpose.dart';

class MockAuthRemoteDataSource implements AuthRemoteDataSource {
  @override
  Future<AuthResponseDto> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) async {
    return const AuthResponseDto(
      user: UserDto(
        id: 'user-123',
        name: 'রাফি আহমেদ',
        email: 'rafi@example.com',
        phone: '01711223344',
        role: 'student',
      ),
      tokens: TokenPairDto(
        accessToken: 'access-jwt-token-123',
        refreshToken: 'refresh-jwt-token-123',
      ),
    );
  }

  @override
  Future<AuthResponseDto> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    String? role,
  }) async {
    return AuthResponseDto(
      user: UserDto(
        id: 'user-456',
        name: name,
        email: email,
        phone: phone,
        role: role ?? 'student',
      ),
      tokens: const TokenPairDto(
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      ),
    );
  }

  @override
  Future<UserDto> getCurrentUser() async {
    return const UserDto(
      id: 'user-123',
      name: 'রাফি আহমেদ',
      email: 'rafi@example.com',
      role: 'student',
    );
  }

  @override
  Future<TokenPairDto> refreshTokens({required String refreshToken}) async {
    return const TokenPairDto(
      accessToken: 'refreshed-access-token',
      refreshToken: 'refreshed-refresh-token',
    );
  }

  @override
  Future<void> logout() async {}

  @override
  Future<void> logoutAll() async {}

  @override
  Future<MessageResponseDto> requestOtp({
    required String phone,
    required String purpose,
  }) async {
    return const MessageResponseDto(message: 'OTP sent');
  }

  @override
  Future<MessageResponseDto> verifyOtp({
    required String phone,
    required String otp,
    required String purpose,
  }) async {
    return const MessageResponseDto(message: 'OTP verified');
  }

  @override
  Future<MessageResponseDto> forgotPassword({required String identifier}) async {
    return const MessageResponseDto(message: 'Instructions sent');
  }

  @override
  Future<MessageResponseDto> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    return const MessageResponseDto(message: 'Password reset successfully');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  FlutterSecureStorage.setMockInitialValues({});

  group('AuthRepositoryImpl Unit Tests', () {
    late AuthRepositoryImpl repository;
    late MockAuthRemoteDataSource mockRemoteDataSource;
    late ApiClient apiClient;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      mockRemoteDataSource = MockAuthRemoteDataSource();
      apiClient = ApiClient();
      repository = AuthRepositoryImpl(mockRemoteDataSource, apiClient);
    });

    test('login returns mapped User entity with correct fields', () async {
      final user = await repository.login(
        identifier: '01711223344',
        password: 'password123',
      );

      expect(user.id, 'user-123');
      expect(user.name, 'রাফি আহমেদ');
      expect(user.email, 'rafi@example.com');
      expect(user.role, UserRole.student);
    });

    test('register returns newly created User', () async {
      final user = await repository.register(
        name: 'সাকিব আল হাসান',
        phone: '01811223344',
        password: 'SecurePassword123',
        role: UserRole.parent,
      );

      expect(user.id, 'user-456');
      expect(user.name, 'সাকিব আল হাসান');
      expect(user.role, UserRole.parent);
    });

    test('getCurrentUser returns authenticated profile', () async {
      final user = await repository.getCurrentUser();
      expect(user.id, 'user-123');
      expect(user.isStudent, isTrue);
    });

    test('requestOtp and verifyOtp return success messages', () async {
      final reqMsg = await repository.requestOtp(
        phone: '01711223344',
        purpose: OtpPurpose.registration,
      );
      expect(reqMsg, 'OTP sent');

      final verifyMsg = await repository.verifyOtp(
        phone: '01711223344',
        otp: '123456',
        purpose: OtpPurpose.registration,
      );
      expect(verifyMsg, 'OTP verified');
    });
  });
}
