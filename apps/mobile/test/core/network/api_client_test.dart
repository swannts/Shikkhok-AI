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
  });
}
