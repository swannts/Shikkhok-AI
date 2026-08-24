import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user.dart';
import '../../domain/entities/otp_purpose.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/datasources/auth_remote_data_source.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/token_storage.dart';
import '../../../../core/errors/app_failure.dart';
import '../state/auth_state.dart';

final authApiClientProvider = Provider<ApiClient>((ref) {
  return apiClient;
});

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSourceImpl(ref.read(authApiClientProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    ref.read(authRemoteDataSourceProvider),
    ref.read(authApiClientProvider),
  );
});

class AuthController extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;

  AuthController(this._authRepository) : super(const AuthInitial());

  Future<void> restoreSession() async {
    state = const AuthLoading('সেশন যাচাই করা হচ্ছে...');
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null || token.isEmpty) {
        state = const Unauthenticated();
        return;
      }

      try {
        final user = await _authRepository.getCurrentUser();
        state = Authenticated(user);
      } catch (e) {
        // Access token failed, attempt single-flight refresh
        final refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken == null || refreshToken.isEmpty) {
          await TokenStorage.clearTokens();
          state = const Unauthenticated();
          return;
        }

        try {
          await _authRepository.refreshTokens(refreshToken: refreshToken);
          final user = await _authRepository.getCurrentUser();
          state = Authenticated(user);
        } catch (_) {
          await TokenStorage.clearTokens();
          state = const Unauthenticated();
        }
      }
    } catch (_) {
      await TokenStorage.clearTokens();
      state = const Unauthenticated();
    }
  }

  Future<bool> login({
    required String identifier,
    required String password,
  }) async {
    state = const AuthLoading('লগইন করা হচ্ছে...');
    try {
      final user = await _authRepository.login(
        identifier: identifier,
        password: password,
      );
      state = Authenticated(user);
      return true;
    } on AppFailure catch (e) {
      state = AuthFailureState(e);
      return false;
    } catch (e) {
      state = AuthFailureState(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        ),
      );
      return false;
    }
  }

  Future<bool> register({
    required String name,
    String? email,
    String? phone,
    required String password,
    UserRole? role,
  }) async {
    state = const AuthLoading('অ্যাকাউন্ট তৈরি হচ্ছে...');
    try {
      final user = await _authRepository.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
        role: role,
      );
      state = Authenticated(user);
      return true;
    } on AppFailure catch (e) {
      state = AuthFailureState(e);
      return false;
    } catch (e) {
      state = AuthFailureState(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        ),
      );
      return false;
    }
  }

  Future<bool> requestOtp({
    required String phone,
    required OtpPurpose purpose,
  }) async {
    state = const AuthLoading('ওটিপি পাঠানো হচ্ছে...');
    try {
      final message = await _authRepository.requestOtp(
        phone: phone,
        purpose: purpose,
      );
      state = OtpSentState(phone: phone, purpose: purpose, message: message);
      return true;
    } on AppFailure catch (e) {
      state = AuthFailureState(e);
      return false;
    } catch (e) {
      state = AuthFailureState(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'ওটিপি পাঠানো সম্ভব হয়নি।',
        ),
      );
      return false;
    }
  }

  Future<bool> verifyOtp({
    required String phone,
    required String otp,
    required OtpPurpose purpose,
  }) async {
    state = const AuthLoading('ওটিপি যাচাই করা হচ্ছে...');
    try {
      final message = await _authRepository.verifyOtp(
        phone: phone,
        otp: otp,
        purpose: purpose,
      );
      state = Unauthenticated(message);
      return true;
    } on AppFailure catch (e) {
      state = AuthFailureState(e);
      return false;
    } catch (e) {
      state = AuthFailureState(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'ওটিপি যাচাই ব্যর্থ হয়েছে।',
        ),
      );
      return false;
    }
  }

  Future<bool> forgotPassword({required String identifier}) async {
    state = const AuthLoading('পাসওয়ার্ড রিসেট পাঠানো হচ্ছে...');
    try {
      final message =
          await _authRepository.forgotPassword(identifier: identifier);
      state = PasswordResetSentState(message);
      return true;
    } on AppFailure catch (e) {
      state = AuthFailureState(e);
      return false;
    } catch (e) {
      state = AuthFailureState(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'পাসওয়ার্ড রিসেট অনুরোধ পাঠানো যায়নি।',
        ),
      );
      return false;
    }
  }

  Future<bool> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    state = const AuthLoading('পাসওয়ার্ড আপডেট করা হচ্ছে...');
    try {
      final message = await _authRepository.resetPassword(
        token: token,
        newPassword: newPassword,
      );
      state = Unauthenticated(message);
      return true;
    } on AppFailure catch (e) {
      state = AuthFailureState(e);
      return false;
    } catch (e) {
      state = AuthFailureState(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।',
        ),
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = const AuthLoading('লগআউট করা হচ্ছে...');
    try {
      await _authRepository.logout();
    } finally {
      state = const Unauthenticated();
    }
  }

  Future<void> logoutAll() async {
    state = const AuthLoading('সব ডিভাইস থেকে লগআউট করা হচ্ছে...');
    try {
      await _authRepository.logoutAll();
    } finally {
      state = const Unauthenticated();
    }
  }

  void clearError() {
    if (state is AuthFailureState) {
      state = const Unauthenticated();
    }
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.read(authRepositoryProvider));
});
