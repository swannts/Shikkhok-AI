import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class VerifyOtpUseCase {
  final AuthRepository _repository;
  VerifyOtpUseCase(this._repository);

  Future<User> execute({required String referenceId, required String otp}) {
    return _repository.verifyOtp(referenceId: referenceId, otp: otp);
  }
}
