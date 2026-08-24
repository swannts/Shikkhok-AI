import '../entities/user.dart';
import '../entities/token_pair.dart';
import '../entities/otp_purpose.dart';

abstract interface class AuthRepository {
  Future<User> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    UserRole? role,
  });

  Future<User> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  });

  Future<TokenPair> refreshTokens({required String refreshToken});

  Future<void> logout();

  Future<void> logoutAll();

  Future<User> getCurrentUser();

  Future<String> requestOtp({
    required String phone,
    required OtpPurpose purpose,
  });

  Future<String> verifyOtp({
    required String phone,
    required String otp,
    required OtpPurpose purpose,
  });

  Future<String> forgotPassword({required String identifier});

  Future<String> resetPassword({
    required String token,
    required String newPassword,
  });
}
