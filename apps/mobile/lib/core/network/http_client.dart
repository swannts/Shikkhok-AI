import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../config/env.dart';
import '../storage/token_storage.dart';

class ApiError implements Exception {
  final int statusCode;
  final String errorCode;
  final String message;
  final String banglaMessage;

  ApiError({
    required this.statusCode,
    required this.errorCode,
    required this.message,
    required this.banglaMessage,
  });

  @override
  String toString() => 'ApiError($statusCode, $errorCode): $message';
}

class HttpClient {
  final String baseUrl;
  bool _isRefreshing = false;
  final List<Completer<String?>> _refreshQueue = [];

  HttpClient(this.baseUrl);

  Future<Map<String, String>> _getHeaders({bool skipAuth = false}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (!skipAuth) {
      final token = await TokenStorage.getAccessToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<dynamic> request(
    String endpoint, {
    String method = 'GET',
    dynamic body,
    bool skipAuth = false,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final url = Uri.parse(endpoint.startsWith('http') ? endpoint : '$baseUrl$endpoint');
    final headers = await _getHeaders(skipAuth: skipAuth);

    try {
      http.Response response;
      if (method == 'POST') {
        response = await http.post(url, headers: headers, body: jsonEncode(body)).timeout(timeout);
      } else if (method == 'PUT') {
        response = await http.put(url, headers: headers, body: jsonEncode(body)).timeout(timeout);
      } else if (method == 'DELETE') {
        response = await http.delete(url, headers: headers).timeout(timeout);
      } else {
        response = await http.get(url, headers: headers).timeout(timeout);
      }

      // Single-flight 401 Refresh Token Queue
      if (response.statusCode == 401 && !skipAuth && !endpoint.contains('/auth/login') && !endpoint.contains('/auth/refresh')) {
        return await _handle401AndRetry(endpoint, method: method, body: body, timeout: timeout);
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        dynamic errorJson = {};
        try {
          errorJson = jsonDecode(response.body);
        } catch (_) {}
        throw ApiError(
          statusCode: response.statusCode,
          errorCode: errorJson['errorCode'] ?? 'HTTP_${response.statusCode}',
          message: errorJson['message'] ?? 'Request failed',
          banglaMessage: errorJson['banglaMessage'] ?? 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        );
      }

      return jsonDecode(response.body);
    } on TimeoutException {
      throw ApiError(
        statusCode: 408,
        errorCode: 'REQUEST_TIMEOUT',
        message: 'Request timed out',
        banglaMessage: 'অনুরোধের সময় পার হয়ে গেছে। নেটওয়ার্ক চেক করুন।',
      );
    } catch (e) {
      if (e is ApiError) rethrow;
      throw ApiError(
        statusCode: 500,
        errorCode: 'NETWORK_ERROR',
        message: e.toString(),
        banglaMessage: 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে।',
      );
    }
  }

  Future<dynamic> _handle401AndRetry(
    String endpoint, {
    required String method,
    dynamic body,
    required Duration timeout,
  }) async {
    if (!_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken == null) throw Exception('No refresh token');

        final refreshRes = await request(
          '/auth/refresh',
          method: 'POST',
          body: {'refreshToken': refreshToken},
          skipAuth: true,
        );

        final newToken = refreshRes['token'] as String;
        await TokenStorage.setAccessToken(newToken);
        if (refreshRes['refreshToken'] != null) {
          await TokenStorage.setRefreshToken(refreshRes['refreshToken']);
        }

        _isRefreshing = false;
        _resolveQueue(newToken);
        return await request(endpoint, method: method, body: body, timeout: timeout);
      } catch (e) {
        _isRefreshing = false;
        _resolveQueue(null);
        await TokenStorage.clearTokens();
        throw ApiError(
          statusCode: 401,
          errorCode: 'UNAUTHORIZED',
          message: 'Session expired',
          banglaMessage: 'আপনার সেশনের মেয়াদ পার হয়ে গেছে। পুনরায় লগইন করুন।',
        );
      }
    }

    final completer = Completer<String?>();
    _refreshQueue.add(completer);
    final newToken = await completer.future;

    if (newToken != null) {
      return await request(endpoint, method: method, body: body, timeout: timeout);
    } else {
      throw ApiError(
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
        message: 'Session expired',
        banglaMessage: 'আপনার সেশনের মেয়াদ পার হয়ে গেছে। পুনরায় লগইন করুন।',
      );
    }
  }

  void _resolveQueue(String? token) {
    for (var c in _refreshQueue) {
      c.complete(token);
    }
    _refreshQueue.clear();
  }

  Future<String> streamText(
    String endpoint,
    dynamic body,
    void Function(String delta) onDelta,
  ) async {
    final url = Uri.parse(endpoint.startsWith('http') ? endpoint : '$baseUrl$endpoint');
    final headers = await _getHeaders();
    headers['Accept'] = 'text/event-stream, application/json';

    final client = http.Client();
    final req = http.Request('POST', url);
    req.headers.addAll(headers);
    req.body = jsonEncode(body);

    final res = await client.send(req);
    var fullText = '';

    await for (final chunk in res.stream.transform(utf8.decoder)) {
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
              fullText += delta;
              onDelta(delta);
            }
          } catch (_) {
            fullText += dataContent;
            onDelta(dataContent);
          }
        }
      }
    }
    client.close();
    return fullText;
  }
}

final httpClient = HttpClient(ENV.apiBaseUrl);
final aiGatewayClient = HttpClient(ENV.aiGatewayUrl);
