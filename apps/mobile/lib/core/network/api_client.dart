import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/env.dart';
import '../storage/token_storage.dart';
import '../session/session_manager.dart';
import '../errors/app_failure.dart';
import 'api_endpoints.dart';
import 'sse_event.dart';
import 'sse_parser.dart';

class ApiClient {
  late final Dio dio;
  bool _isRefreshing = false;
  final List<Completer<String?>> _refreshQueue = [];

  ApiClient({String? baseUrl, Dio? customDio}) {
    dio = customDio ??
        Dio(
          BaseOptions(
            baseUrl: baseUrl ?? ENV.apiBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 30),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

    _setupInterceptors();
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final skipAuth = options.extra['skipAuth'] == true;
          if (!skipAuth) {
            final token = await TokenStorage.getAccessToken();
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          return handler.next(options);
        },
        onError: (DioException err, handler) async {
          final isAuthEndpoint =
              err.requestOptions.path.contains('/auth/login') ||
                  err.requestOptions.path.contains('/auth/register') ||
                  err.requestOptions.path.contains('/auth/refresh');
          final skipAuth = err.requestOptions.extra['skipAuth'] == true;
          final alreadyRetried =
              err.requestOptions.extra['retriedAfterRefresh'] == true;

          // Single-Flight 401 Refresh Token Concurrency Queue with Loop Protection
          if (err.response?.statusCode == 401 &&
              !skipAuth &&
              !isAuthEndpoint &&
              !alreadyRetried) {
            try {
              final newToken = await _handleSingleFlightRefresh();
              if (newToken != null && newToken.isNotEmpty) {
                final retryOptions = err.requestOptions;
                retryOptions.headers['Authorization'] = 'Bearer $newToken';
                retryOptions.extra['retriedAfterRefresh'] = true;

                final response = await dio.request(
                  retryOptions.path,
                  data: retryOptions.data,
                  queryParameters: retryOptions.queryParameters,
                  cancelToken: retryOptions.cancelToken,
                  options: Options(
                    method: retryOptions.method,
                    headers: retryOptions.headers,
                    extra: retryOptions.extra,
                    responseType: retryOptions.responseType,
                    contentType: retryOptions.contentType,
                    validateStatus: retryOptions.validateStatus,
                    receiveTimeout: retryOptions.receiveTimeout,
                    sendTimeout: retryOptions.sendTimeout,
                  ),
                );
                return handler.resolve(response);
              }
            } catch (_) {
              await TokenStorage.clearTokens();
              sessionManager.notifySessionExpired();
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
        if (refreshToken == null || refreshToken.isEmpty) {
          throw const UnauthorizedFailure();
        }

        final refreshRes = await dio.post(
          ApiEndpoints.refresh,
          data: {'refreshToken': refreshToken},
          options: Options(extra: {'skipAuth': true}),
        );

        final resData = refreshRes.data;
        final data =
            resData is Map<String, dynamic> && resData.containsKey('data')
                ? resData['data']
                : resData;

        final newToken = (data['accessToken'] ?? data['token']) as String;
        final newRefreshToken =
            (data['refreshToken'] ?? refreshToken) as String;

        await TokenStorage.saveTokens(
          accessToken: newToken,
          refreshToken: newRefreshToken,
        );

        _isRefreshing = false;
        _resolveQueue(newToken);
        return newToken;
      } catch (e) {
        _isRefreshing = false;
        _resolveQueue(null);
        await TokenStorage.clearTokens();
        sessionManager.notifySessionExpired();
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

    if (err.type == DioExceptionType.connectionError) {
      return const NetworkFailure();
    }

    if (err.response != null) {
      final status = err.response!.statusCode;
      final rawData = err.response!.data;

      String message = 'Request failed';
      String banglaMessage = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      String errorCode = 'HTTP_$status';
      Map<String, dynamic>? details;

      if (rawData is Map<String, dynamic>) {
        if (rawData.containsKey('error') &&
            rawData['error'] is Map<String, dynamic>) {
          final errorObj = rawData['error'] as Map<String, dynamic>;
          message = errorObj['message']?.toString() ?? message;
          errorCode = errorObj['code']?.toString() ?? errorCode;
          if (errorObj['details'] is Map<String, dynamic>) {
            details = errorObj['details'] as Map<String, dynamic>;
          }
        } else {
          message = rawData['message']?.toString() ?? message;
          errorCode = rawData['errorCode']?.toString() ?? errorCode;
        }
      }

      switch (status) {
        case 400:
          return ValidationFailure(
            message: message,
            banglaMessage:
                'প্রদত্ত তথ্য সঠিক নয়। অনুগ্রহ করে আবার পরীক্ষা করুন।',
            errorCode: errorCode,
            details: details,
          );
        case 401:
          return UnauthorizedFailure(
            message: message,
            banglaMessage: 'আপনার সেশনের মেয়াদ শেষ হয়েছে অথবা তথ্য ভুল।',
            errorCode: errorCode,
            details: details,
          );
        case 403:
          return ForbiddenFailure(
            message: message,
            banglaMessage: 'এই তথ্যে অ্যাক্সেস করার অনুমতি নেই।',
            errorCode: errorCode,
            details: details,
          );
        case 404:
          return NotFoundFailure(
            message: message,
            banglaMessage: 'অনুরোধকৃত তথ্য খুঁজে পাওয়া যায়নি।',
            errorCode: errorCode,
            details: details,
          );
        case 409:
          return ConflictFailure(
            message: message,
            banglaMessage:
                'এই ইমেইল বা ফোন নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট খোলা হয়েছে।',
            errorCode: errorCode,
            details: details,
          );
        case 429:
          return RateLimitFailure(
            message: message,
            banglaMessage:
                'খুব বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।',
            errorCode: errorCode,
            details: details,
          );
        default:
          if (status != null && status >= 500) {
            return ServerFailure(
              message: message,
              banglaMessage:
                  'সার্ভারে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।',
              errorCode: errorCode,
              details: details,
            );
          }
      }

      return ServerFailure(
        message: message,
        banglaMessage: banglaMessage,
        errorCode: errorCode,
        details: details,
      );
    }

    return const NetworkFailure();
  }

  Stream<SseEvent> streamSse(
    String endpoint, {
    Map<String, dynamic>? data,
    CancelToken? cancelToken,
  }) async* {
    final token = await TokenStorage.getAccessToken();
    final response = await dio.post<ResponseBody>(
      endpoint,
      data: data,
      cancelToken: cancelToken,
      options: Options(
        responseType: ResponseType.stream,
        headers: {
          'Accept': 'text/event-stream, application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ),
    );

    final rawStream = response.data!.stream;
    yield* rawStream.cast<List<int>>().transform(const SseParser());
  }

  Stream<String> streamText(String endpoint, Map<String, dynamic> body) async* {
    await for (final event in streamSse(endpoint, data: body)) {
      if (event.data == '[DONE]') break;
      yield event.data;
    }
  }
}

final apiClient = ApiClient();
final aiGatewayClient = ApiClient(baseUrl: ENV.aiGatewayUrl);

final apiClientProvider = Provider<ApiClient>((ref) => apiClient);
final aiGatewayClientProvider = Provider<ApiClient>((ref) => aiGatewayClient);
