import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/signup_usecase.dart';
import '../../domain/usecases/verify_otp_usecase.dart';
import '../../data/datasources/auth_remote_data_source.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/token_storage.dart';
import '../../../../core/errors/app_failure.dart';
import '../state/auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final remoteDataSource = AuthRemoteDataSourceImpl(apiClient);
  return AuthRepositoryImpl(remoteDataSource);
});

final loginUseCaseProvider = Provider<LoginUseCase>((ref) {
  return LoginUseCase(ref.read(authRepositoryProvider));
});

final signupUseCaseProvider = Provider<SignupUseCase>((ref) {
  return SignupUseCase(ref.read(authRepositoryProvider));
});

final verifyOtpUseCaseProvider = Provider<VerifyOtpUseCase>((ref) {
  return VerifyOtpUseCase(ref.read(authRepositoryProvider));
});

class AuthController extends StateNotifier<AuthState> {
  final Ref _ref;

  AuthController(this._ref) : super(const AuthInitial());

  Future<void> restoreSession() async {
    state = const AuthLoading();
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        state = const Unauthenticated();
        return;
      }

      try {
        final repo = _ref.read(authRepositoryProvider);
        final user = await repo.getCurrentUser();
        state = Authenticated(user);
      } catch (_) {
        final refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken == null) {
          await TokenStorage.clearTokens();
          state = const Unauthenticated();
          return;
        }
        final repo = _ref.read(authRepositoryProvider);
        final user = await repo.getCurrentUser();
        state = Authenticated(user);
      }
    } catch (_) {
      await TokenStorage.clearTokens();
      state = const Unauthenticated();
    }
  }

  Future<void> login(String identifier, String password) async {
    state = const AuthLoading();
    try {
      final useCase = _ref.read(loginUseCaseProvider);
      final user = await useCase.execute(identifier: identifier, password: password);
      state = Authenticated(user);
    } catch (e) {
      if (e is AppFailure) {
        state = AuthFailureState(e);
      } else {
        state = const AuthFailureState(ServerFailure(
          message: 'Failed to login',
          banglaMessage: 'লগইন করতে সমস্যা হয়েছে। পাসওয়ার্ড আবার চেক করুন।',
        ));
      }
    }
  }

  Future<String?> signup(String name, String phoneOrEmail, String password) async {
    state = const AuthLoading();
    try {
      final useCase = _ref.read(signupUseCaseProvider);
      final refId = await useCase.execute(name: name, phoneOrEmail: phoneOrEmail, password: password);
      state = const Unauthenticated();
      return refId;
    } catch (e) {
      if (e is AppFailure) {
        state = AuthFailureState(e);
      } else {
        state = const AuthFailureState(ServerFailure(
          message: 'Failed to signup',
          banglaMessage: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        ));
      }
      return null;
    }
  }

  Future<void> verifyOtp(String referenceId, String otp) async {
    state = const AuthLoading();
    try {
      final useCase = _ref.read(verifyOtpUseCaseProvider);
      final user = await useCase.execute(referenceId: referenceId, otp: otp);
      state = Authenticated(user);
    } catch (e) {
      if (e is AppFailure) {
        state = AuthFailureState(e);
      } else {
        state = const AuthFailureState(ServerFailure(
          message: 'Invalid OTP',
          banglaMessage: 'ভুল ওটিপি কোড। আবার চেষ্টা করুন।',
        ));
      }
    }
  }

  Future<void> logout() async {
    final repo = _ref.read(authRepositoryProvider);
    await repo.logout();
    state = const Unauthenticated();
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});
