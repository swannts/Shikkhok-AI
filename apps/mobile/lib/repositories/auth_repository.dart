import '../core/network/http_client.dart';
import '../core/config/env.dart';
import '../models/user.dart';

class AuthRepository {
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    if (ENV.useMockApi) {
      return {
        'token': 'mock-jwt-access-token',
        'refreshToken': 'mock-refresh-token',
        'user': StudentProfile(
          id: 'student-1',
          userId: 'user-1',
          name: 'শিক্ষার্থী',
          classId: '',
          className: '',
          language: 'bn',
        ).toJson(),
      };
    }
    return await httpClient.request('/auth/login',
        method: 'POST',
        body: {
          'identifier': identifier,
          'password': password,
        },
        skipAuth: true);
  }

  Future<Map<String, dynamic>> signup(
      String name, String phoneOrEmail, String password) async {
    if (ENV.useMockApi) {
      return {'status': 'OTP_SENT', 'referenceId': 'mock-ref-123'};
    }
    return await httpClient.request('/auth/signup',
        method: 'POST',
        body: {
          'name': name,
          'phoneOrEmail': phoneOrEmail,
          'password': password,
        },
        skipAuth: true);
  }

  Future<Map<String, dynamic>> verifyOtp(String referenceId, String otp) async {
    if (ENV.useMockApi) {
      return {
        'token': 'mock-jwt-access-token',
        'refreshToken': 'mock-refresh-token',
        'user': StudentProfile(
          id: 'student-1',
          userId: 'user-1',
          name: 'শিক্ষার্থী',
          classId: '',
          className: '',
          language: 'bn',
        ).toJson(),
      };
    }
    return await httpClient.request('/auth/verify-otp',
        method: 'POST',
        body: {
          'referenceId': referenceId,
          'otp': otp,
        },
        skipAuth: true);
  }

  Future<StudentProfile> getCurrentUser() async {
    if (ENV.useMockApi) {
      return StudentProfile(
        id: 'student-1',
        userId: 'user-1',
        name: 'শিক্ষার্থী',
        classId: '',
        className: '',
        language: 'bn',
      );
    }
    final json = await httpClient.request('/auth/me');
    return StudentProfile.fromJson(json);
  }

  Future<void> logout() async {
    if (!ENV.useMockApi) {
      try {
        await httpClient.request('/auth/logout', method: 'POST');
      } catch (_) {}
    }
  }
}

final authRepository = AuthRepository();
