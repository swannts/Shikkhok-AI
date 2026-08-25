import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/session/session_manager.dart';

void main() {
  group('SessionManager Unit Tests', () {
    late SessionManager manager;

    setUp(() {
      manager = SessionManager();
    });

    tearDown(() {
      manager.dispose();
    });

    test('notifySessionExpired emits SessionEvent.expired', () async {
      final expectation = expectLater(
        manager.events,
        emits(SessionEvent.expired),
      );

      manager.notifySessionExpired();

      await expectation;
    });

    test('notifyLoggedOut emits SessionEvent.loggedOut', () async {
      final expectation = expectLater(
        manager.events,
        emits(SessionEvent.loggedOut),
      );

      manager.notifyLoggedOut();

      await expectation;
    });
  });
}
