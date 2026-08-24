import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/token_storage.dart';
import '../../../../core/errors/app_failure.dart';
import '../../domain/entities/user.dart';
import '../../domain/entities/token_pair.dart';
import '../../domain/entities/otp_purpose.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../mappers/user_mapper.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  AuthRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<User> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    UserRole? role,
  }) async {
    try {
      final res = await _remoteDataSource.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
        role: role?.toApiString(),
      );

      final user = UserMapper.toDomain(res.user);

      await TokenStorage.saveTokens(
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      );

      await TokenStorage.saveUserMetadata(
        userId: user.id,
        userRole: user.role.toApiString(),
      );

      return user;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'নিবন্ধন সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।',
      );
    }
  }

  @override
  Future<User> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) async {
    try {
      final resolvedDeviceId =
          deviceId ?? await TokenStorage.getOrCreateDeviceId();

      final res = await _remoteDataSource.login(
        identifier: identifier,
        password: password,
        deviceId: resolvedDeviceId,
        deviceName: deviceName,
      );

      final user = UserMapper.toDomain(res.user);

      await TokenStorage.saveTokens(
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      );

      await TokenStorage.saveUserMetadata(
        userId: user.id,
        userRole: user.role.toApiString(),
      );

      return user;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'লগইন সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।',
      );
    }
  }

  @override
  Future<TokenPair> refreshTokens({required String refreshToken}) async {
    try {
      final res =
          await _remoteDataSource.refreshTokens(refreshToken: refreshToken);
      final domainTokens = UserMapper.tokenPairToDomain(res);

      await TokenStorage.saveTokens(
        accessToken: domainTokens.accessToken,
        refreshToken: domainTokens.refreshToken,
      );

      return domainTokens;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw const UnauthorizedFailure();
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _remoteDataSource.logout();
    } catch (_) {
      // Fail-safe: always clear tokens locally even if backend logout fails
    } finally {
      await TokenStorage.clearTokens();
    }
  }

  @override
  Future<void> logoutAll() async {
    try {
      await _remoteDataSource.logoutAll();
    } catch (_) {
    } finally {
      await TokenStorage.clearTokens();
    }
  }

  @override
  Future<User> getCurrentUser() async {
    try {
      final res = await _remoteDataSource.getCurrentUser();
      final user = UserMapper.toDomain(res);

      await TokenStorage.saveUserMetadata(
        userId: user.id,
        userRole: user.role.toApiString(),
      );

      return user;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'ব্যবহারকারীর তথ্য আনতে সমস্যা হয়েছে।',
      );
    }
  }

  @override
  Future<String> requestOtp({
    required String phone,
    required OtpPurpose purpose,
  }) async {
    try {
      final res = await _remoteDataSource.requestOtp(
        phone: phone,
        purpose: purpose.toApiString(),
      );
      return res.message;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'ওটিপি পাঠানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      );
    }
  }

  @override
  Future<String> verifyOtp({
    required String phone,
    required String otp,
    required OtpPurpose purpose,
  }) async {
    try {
      final res = await _remoteDataSource.verifyOtp(
        phone: phone,
        otp: otp,
        purpose: purpose.toApiString(),
      );
      return res.message;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'ওটিপি যাচাই করা সম্ভব হয়নি। আবার চেষ্টা করুন।',
      );
    }
  }

  @override
  Future<String> forgotPassword({required String identifier}) async {
    try {
      final res =
          await _remoteDataSource.forgotPassword(identifier: identifier);
      return res.message;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'পাসওয়ার্ড রিসেট অনুরোধ পাঠানো সম্ভব হয়নি।',
      );
    }
  }

  @override
  Future<String> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final res = await _remoteDataSource.resetPassword(
        token: token,
        newPassword: newPassword,
      );
      return res.message;
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি।',
      );
    }
  }
}
