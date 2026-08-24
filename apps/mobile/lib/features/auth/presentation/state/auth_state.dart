import '../../domain/entities/user.dart';
import '../../domain/entities/otp_purpose.dart';
import '../../../../core/errors/app_failure.dart';

sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  final String? loadingMessage;
  const AuthLoading([this.loadingMessage]);
}

class Authenticated extends AuthState {
  final User user;
  const Authenticated(this.user);
}

class Unauthenticated extends AuthState {
  final String? message;
  const Unauthenticated([this.message]);
}

class OtpSentState extends AuthState {
  final String phone;
  final OtpPurpose purpose;
  final String message;

  const OtpSentState({
    required this.phone,
    required this.purpose,
    required this.message,
  });
}

class PasswordResetSentState extends AuthState {
  final String message;
  const PasswordResetSentState(this.message);
}

class AuthFailureState extends AuthState {
  final AppFailure failure;
  const AuthFailureState(this.failure);
}
