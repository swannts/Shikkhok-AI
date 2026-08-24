import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/auth_response_dto.dart';
import '../dto/token_pair_dto.dart';
import '../dto/user_dto.dart';
import '../dto/message_response_dto.dart';

abstract interface class AuthRemoteDataSource {
  Future<AuthResponseDto> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    String? role,
  });

  Future<AuthResponseDto> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  });

  Future<TokenPairDto> refreshTokens({required String refreshToken});

  Future<void> logout();

  Future<void> logoutAll();

  Future<UserDto> getCurrentUser();

  Future<MessageResponseDto> requestOtp({
    required String phone,
    required String purpose,
  });

  Future<MessageResponseDto> verifyOtp({
    required String phone,
    required String otp,
    required String purpose,
  });

  Future<MessageResponseDto> forgotPassword({required String identifier});

  Future<MessageResponseDto> resetPassword({
    required String token,
    required String newPassword,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _client;

  AuthRemoteDataSourceImpl(this._client);

  @override
  Future<AuthResponseDto> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    String? role,
  }) async {
    final payload = <String, dynamic>{
      'name': name,
      'password': password,
      if (email != null && email.isNotEmpty) 'email': email,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      if (role != null && role.isNotEmpty) 'role': role,
    };

    final res = await _client.dio.post(
      ApiEndpoints.register,
      data: payload,
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return AuthResponseDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseDto> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) async {
    final payload = <String, dynamic>{
      'identifier': identifier,
      'password': password,
      if (deviceId != null && deviceId.isNotEmpty) 'deviceId': deviceId,
      if (deviceName != null && deviceName.isNotEmpty) 'deviceName': deviceName,
    };

    final res = await _client.dio.post(
      ApiEndpoints.login,
      data: payload,
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return AuthResponseDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<TokenPairDto> refreshTokens({required String refreshToken}) async {
    final res = await _client.dio.post(
      ApiEndpoints.refresh,
      data: {'refreshToken': refreshToken},
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return TokenPairDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<void> logout() async {
    await _client.dio.post(ApiEndpoints.logout);
  }

  @override
  Future<void> logoutAll() async {
    await _client.dio.post(ApiEndpoints.logoutAll);
  }

  @override
  Future<UserDto> getCurrentUser() async {
    final res = await _client.dio.get(ApiEndpoints.me);
    final data = _extractData(res.data);
    return UserDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<MessageResponseDto> requestOtp({
    required String phone,
    required String purpose,
  }) async {
    final res = await _client.dio.post(
      ApiEndpoints.requestOtp,
      data: {
        'phone': phone,
        'purpose': purpose,
      },
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return MessageResponseDto.fromJson(
      data is Map<String, dynamic> ? data : {'message': 'OTP sent'},
    );
  }

  @override
  Future<MessageResponseDto> verifyOtp({
    required String phone,
    required String otp,
    required String purpose,
  }) async {
    final res = await _client.dio.post(
      ApiEndpoints.verifyOtp,
      data: {
        'phone': phone,
        'otp': otp,
        'purpose': purpose,
      },
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return MessageResponseDto.fromJson(
      data is Map<String, dynamic> ? data : {'message': 'OTP verified'},
    );
  }

  @override
  Future<MessageResponseDto> forgotPassword(
      {required String identifier}) async {
    final res = await _client.dio.post(
      ApiEndpoints.forgotPassword,
      data: {'identifier': identifier},
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return MessageResponseDto.fromJson(
      data is Map<String, dynamic>
          ? data
          : {'message': 'Reset instructions sent if account exists'},
    );
  }

  @override
  Future<MessageResponseDto> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final res = await _client.dio.post(
      ApiEndpoints.resetPassword,
      data: {
        'token': token,
        'newPassword': newPassword,
      },
      options: Options(extra: {'skipAuth': true}),
    );

    final data = _extractData(res.data);
    return MessageResponseDto.fromJson(
      data is Map<String, dynamic>
          ? data
          : {'message': 'Password reset successfully'},
    );
  }

  dynamic _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic> &&
        responseData.containsKey('data')) {
      return responseData['data'];
    }
    return responseData;
  }
}
