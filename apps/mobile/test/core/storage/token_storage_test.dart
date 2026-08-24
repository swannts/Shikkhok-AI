import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/storage/token_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  FlutterSecureStorage.setMockInitialValues({});

  group('TokenStorage Unit Tests', () {
    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
    });

    test('saveTokens and readTokens work correctly', () async {
      await TokenStorage.saveTokens(
        accessToken: 'sample-access-token',
        refreshToken: 'sample-refresh-token',
      );

      final accessToken = await TokenStorage.getAccessToken();
      final refreshToken = await TokenStorage.getRefreshToken();
      final hasToken = await TokenStorage.hasAccessToken();

      expect(accessToken, 'sample-access-token');
      expect(refreshToken, 'sample-refresh-token');
      expect(hasToken, isTrue);
    });

    test('saveUserMetadata and readUserMetadata work correctly', () async {
      await TokenStorage.saveUserMetadata(
        userId: 'usr-999',
        userRole: 'student',
      );

      final userId = await TokenStorage.getUserId();
      final userRole = await TokenStorage.getUserRole();

      expect(userId, 'usr-999');
      expect(userRole, 'student');
    });

    test('clearTokens removes all stored tokens and metadata', () async {
      await TokenStorage.saveTokens(
        accessToken: 'sample-access-token',
        refreshToken: 'sample-refresh-token',
      );
      await TokenStorage.saveUserMetadata(
        userId: 'usr-999',
        userRole: 'student',
      );

      await TokenStorage.clearTokens();

      final accessToken = await TokenStorage.getAccessToken();
      final refreshToken = await TokenStorage.getRefreshToken();
      final userId = await TokenStorage.getUserId();

      expect(accessToken, isNull);
      expect(refreshToken, isNull);
      expect(userId, isNull);
    });
  });
}
