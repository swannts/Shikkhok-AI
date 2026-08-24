import '../entities/otp_purpose.dart';
import '../repositories/auth_repository.dart';

class VerifyOtpUseCase {
  final AuthRepository _repository;
  VerifyOtpUseCase(this._repository);

  Future<String> execute({
    required String phone,
    required String otp,
    required OtpPurpose purpose,
  }) {
    return _repository.verifyOtp(
      phone: phone,
      otp: otp,
      purpose: purpose,
    );
  }
}
