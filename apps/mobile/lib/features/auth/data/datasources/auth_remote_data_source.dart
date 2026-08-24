import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/config/env.dart';
import '../dto/user_dto.dart';

abstract class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(String identifier, String password);
  Future<Map<String, dynamic>> signup(String name, String phoneOrEmail, String password);
  Future<Map<String, dynamic>> verifyOtp(String referenceId, String otp);
  Future<UserDto> getCurrentUser();
  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _client;
  AuthRemoteDataSourceImpl(this._client);

  @override
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    if (ENV.useMockApi) {
      return {
        'token': 'mock-jwt-access-token',
        'refreshToken': 'mock-refresh-token',
        'user': const UserDto(
          id: 'student-1',
          userId: 'user-1',
          name: 'রাফি আহমেদ',
          classId: 'class-8',
          className: 'Class 8',
          language: 'bn',
        ).toJson(),
      };
    }
    final res = await _client.dio.post(
      '/auth/login',
      data: {'identifier': identifier, 'password': password},
      options: Options(extra: {'skipAuth': true}),
    );
    return res.data;
  }

  @override
  Future<Map<String, dynamic>> signup(String name, String phoneOrEmail, String password) async {
    if (ENV.useMockApi) {
      return {'status': 'OTP_SENT', 'referenceId': 'mock-ref-123'};
    }
    final res = await _client.dio.post(
      '/auth/signup',
      data: {'name': name, 'phoneOrEmail': phoneOrEmail, 'password': password},
      options: Options(extra: {'skipAuth': true}),
    );
    return res.data;
  }

  @override
  Future<Map<String, dynamic>> verifyOtp(String referenceId, String otp) async {
    if (ENV.useMockApi) {
      return {
        'token': 'mock-jwt-access-token',
        'refreshToken': 'mock-refresh-token',
        'user': const UserDto(
          id: 'student-1',
          userId: 'user-1',
          name: 'রাফি আহমেদ',
          classId: 'class-8',
          className: 'Class 8',
          language: 'bn',
        ).toJson(),
      };
    }
    final res = await _client.dio.post(
      '/auth/verify-otp',
      data: {'referenceId': referenceId, 'otp': otp},
      options: Options(extra: {'skipAuth': true}),
    );
    return res.data;
  }

  @override
  Future<UserDto> getCurrentUser() async {
    if (ENV.useMockApi) {
      return const UserDto(
        id: 'student-1',
        userId: 'user-1',
        name: 'রাফি আহমেদ',
        classId: 'class-8',
        className: 'Class 8',
        language: 'bn',
      );
    }
    final res = await _client.dio.get('/auth/me');
    return UserDto.fromJson(res.data);
  }

  @override
  Future<void> logout() async {
    if (!ENV.useMockApi) {
      try {
        await _client.dio.post('/auth/logout');
      } catch (_) {}
    }
  }
}
