import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum SessionEvent {
  expired,
  loggedOut,
}

class SessionManager {
  final _eventController = StreamController<SessionEvent>.broadcast();

  Stream<SessionEvent> get events => _eventController.stream;

  void notifySessionExpired() {
    _eventController.add(SessionEvent.expired);
  }

  void notifyLoggedOut() {
    _eventController.add(SessionEvent.loggedOut);
  }

  void dispose() {
    _eventController.close();
  }
}

final sessionManager = SessionManager();

final sessionManagerProvider = Provider<SessionManager>((ref) {
  return sessionManager;
});
