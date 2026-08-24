import '../entities/user.dart';

abstract interface class AuthRepository {
  Future<User> login({required String identifier, required String password});
  Future<String> signup({required String name, required String phoneOrEmail, required String password});
  Future<User> verifyOtp({required String referenceId, required String otp});
  Future<User> getCurrentUser();
  Future<void> logout();
}
