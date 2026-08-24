import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../config/env.dart';
import '../storage/token_storage.dart';
import '../errors/app_failure.dart';

class ApiClient {
  late final Dio dio;
  bool _isRefreshing = false;
  final List<Completer<String?>> _refreshQueue = [];

  ApiClient(String baseUrl) {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final skipAuth = options.extra['skipAuth'] == true;
          if (!skipAuth) {
            final token = await TokenStorage.getAccessToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          return handler.next(options);
        },
        onError: (DioException err, handler) async {
          final isAuthEndpoint = err.requestOptions.path.contains('/auth/login') ||
              err.requestOptions.path.contains('/auth/refresh');
          final skipAuth = err.requestOptions.extra['skipAuth'] == true;

          // Single-Flight 401 Refresh Token Concurrency Queue
          if (err.response?.statusCode == 401 && !skipAuth && !isAuthEndpoint) {
            try {
              final newToken = await _handleSingleFlightRefresh();
              if (newToken != null) {
                final retryOptions = err.requestOptions;
                retryOptions.headers['Authorization'] = 'Bearer $newToken';
                final response = await dio.fetch(retryOptions);
                return handler.resolve(response);
              }
            } catch (_) {
              await TokenStorage.clearTokens();
            }
          }
          return handler.next(err);
        },
      ),
    );
  }

  Future<String?> _handleSingleFlightRefresh() async {
    if (!_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken == null) throw const UnauthorizedFailure();

        final refreshRes = await dio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
          options: Options(extra: {'skipAuth': true}),
        );

        final newToken = refreshRes.data['token'] as String;
        await TokenStorage.setAccessToken(newToken);
        if (refreshRes.data['refreshToken'] != null) {
          await TokenStorage.setRefreshToken(refreshRes.data['refreshToken']);
        }

        _isRefreshing = false;
        _resolveQueue(newToken);
        return newToken;
      } catch (e) {
        _isRefreshing = false;
        _resolveQueue(null);
        await TokenStorage.clearTokens();
        rethrow;
      }
    }

    final completer = Completer<String?>();
    _refreshQueue.add(completer);
    return completer.future;
  }

  void _resolveQueue(String? token) {
    for (final c in _refreshQueue) {
      c.complete(token);
    }
    _refreshQueue.clear();
  }

  AppFailure mapDioException(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      return const TimeoutFailure();
    }

    if (err.response != null) {
      final status = err.response!.statusCode;
      final data = err.response!.data;

      String message = 'Request failed';
      String banglaMessage = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      String errorCode = 'HTTP_$status';

      if (data is Map<String, dynamic>) {
        message = data['message'] ?? message;
        banglaMessage = data['banglaMessage'] ?? banglaMessage;
        errorCode = data['errorCode'] ?? errorCode;
      }

      if (status == 401) {
        return const UnauthorizedFailure();
      }
      if (status == 400) {
        return ValidationFailure(message: message, banglaMessage: banglaMessage, errorCode: errorCode);
      }
      return ServerFailure(message: message, banglaMessage: banglaMessage, errorCode: errorCode);
    }

    return const NetworkFailure();
  }

  Stream<String> streamText(String endpoint, Map<String, dynamic> body) async* {
    final token = await TokenStorage.getAccessToken();
    final response = await dio.post<ResponseBody>(
      endpoint,
      data: body,
      options: Options(
        responseType: ResponseType.stream,
        headers: {
          'Accept': 'text/event-stream, application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ),
    );

    final stream = response.data!.stream;
    await for (final chunk in stream.cast<List<int>>().transform(utf8.decoder)) {
      final lines = chunk.split('\n');
      for (final line in lines) {
        final trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          final dataContent = trimmed.substring(5).trim();
          if (dataContent == '[DONE]') break;
          try {
            final parsed = jsonDecode(dataContent);
            final delta = parsed['text'] ?? parsed['delta'] ?? '';
            if (delta.isNotEmpty) {
              yield delta as String;
            }
          } catch (_) {
            yield dataContent;
          }
        }
      }
    }
  }
}

final apiClient = ApiClient(ENV.apiBaseUrl);
final aiGatewayClient = ApiClient(ENV.aiGatewayUrl);
