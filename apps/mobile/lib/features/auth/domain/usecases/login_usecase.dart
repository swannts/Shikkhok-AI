import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class LoginUseCase {
  final AuthRepository _repository;
  LoginUseCase(this._repository);

  Future<User> execute({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) {
    return _repository.login(
      identifier: identifier,
      password: password,
      deviceId: deviceId,
      deviceName: deviceName,
    );
  }
}
