import 'package:flutter/foundation.dart';
import '../core/storage/token_storage.dart';
import '../repositories/auth_repository.dart';
import '../models/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.unknown;
  StudentProfile? _user;

  AuthStatus get status => _status;
  StudentProfile? get user => _user;

  Future<void> restoreSession() async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        _status = AuthStatus.unauthenticated;
        _user = null;
        notifyListeners();
        return;
      }

      try {
        final profile = await authRepository.getCurrentUser();
        _user = profile;
        _status = AuthStatus.authenticated;
      } catch (_) {
        final refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken == null) {
          await TokenStorage.clearTokens();
          _status = AuthStatus.unauthenticated;
          _user = null;
          notifyListeners();
          return;
        }

        // Attempt refresh
        final profile = await authRepository.getCurrentUser();
        _user = profile;
        _status = AuthStatus.authenticated;
      }
    } catch (_) {
      await TokenStorage.clearTokens();
      _status = AuthStatus.unauthenticated;
      _user = null;
    }
    notifyListeners();
  }

  Future<void> login(String identifier, String password) async {
    final res = await authRepository.login(identifier, password);
    final token = res['token'] as String;
    await TokenStorage.setAccessToken(token);
    if (res['refreshToken'] != null) {
      await TokenStorage.setRefreshToken(res['refreshToken']);
    }
    _user = StudentProfile.fromJson(res['user']);
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> verifyOtp(String referenceId, String otp) async {
    final res = await authRepository.verifyOtp(referenceId, otp);
    final token = res['token'] as String;
    await TokenStorage.setAccessToken(token);
    if (res['refreshToken'] != null) {
      await TokenStorage.setRefreshToken(res['refreshToken']);
    }
    _user = StudentProfile.fromJson(res['user']);
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> logout() async {
    await authRepository.logout();
    await TokenStorage.clearTokens();
    _status = AuthStatus.unauthenticated;
    _user = null;
    notifyListeners();
  }
}
