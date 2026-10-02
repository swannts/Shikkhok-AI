import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/errors/app_failure.dart';

void main() {
  group('ApiClient Exception Mapping Tests', () {
    late ApiClient client;

    setUp(() {
      client = ApiClient();
    });

    test('maps connection timeout to TimeoutFailure', () {
      final dioException = DioException(
        type: DioExceptionType.connectionTimeout,
        requestOptions: RequestOptions(path: '/test'),
      );
      final failure = client.mapDioException(dioException);
      expect(failure, isA<TimeoutFailure>());
    });

    test('maps 401 Unauthorized to UnauthorizedFailure', () {
      final dioException = DioException(
        type: DioExceptionType.badResponse,
        requestOptions: RequestOptions(path: '/auth/me'),
        response: Response(
          statusCode: 401,
          requestOptions: RequestOptions(path: '/auth/me'),
          data: {
            'error': {'code': 'UNAUTHORIZED', 'message': 'Invalid token'}
          },
        ),
      );
      final failure = client.mapDioException(dioException);
      expect(failure, isA<UnauthorizedFailure>());
    });

    test('maps 409 Conflict to ConflictFailure', () {
      final dioException = DioException(
        type: DioExceptionType.badResponse,
        requestOptions: RequestOptions(path: '/auth/register'),
        response: Response(
          statusCode: 409,
          requestOptions: RequestOptions(path: '/auth/register'),
          data: {
            'error': {
              'code': 'CONFLICT',
              'message': 'A user with this email already exists'
            }
          },
        ),
      );
      final failure = client.mapDioException(dioException);
      expect(failure, isA<ConflictFailure>());
    });

    test('maps stable AI unavailable code to Bangla guidance', () {
      final failure = client.mapDioException(_response(503, 'AI_UNAVAILABLE'));
      expect(failure, isA<ServerFailure>());
      expect(failure.errorCode, 'AI_UNAVAILABLE');
      expect(failure.banglaMessage, contains('AI শিক্ষক'));
    });

    test('maps sync conflict to a conflict-specific Bangla message', () {
      final failure = client.mapDioException(_response(409, 'SYNC_CONFLICT'));
      expect(failure, isA<ConflictFailure>());
      expect(failure.banglaMessage, contains('অন্য জায়গা'));
    });

    test('marks network and timeout failures as retryable', () {
      final timeout = client.mapDioException(DioException(
        type: DioExceptionType.connectionTimeout,
        requestOptions: RequestOptions(path: '/test'),
      ));
      final network = client.mapDioException(DioException(
        type: DioExceptionType.connectionError,
        requestOptions: RequestOptions(path: '/test'),
      ));
      expect(timeout.retryable, isTrue);
      expect(network.retryable, isTrue);
    });
  });
}

DioException _response(int statusCode, String code) {
  return DioException(
    type: DioExceptionType.badResponse,
    requestOptions: RequestOptions(path: '/test'),
    response: Response(
      statusCode: statusCode,
      requestOptions: RequestOptions(path: '/test'),
      data: {
        'error': {'code': code, 'message': code},
        'requestId': 'test-request',
      },
    ),
  );
}
