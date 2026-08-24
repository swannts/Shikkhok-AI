import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class SignupUseCase {
  final AuthRepository _repository;
  SignupUseCase(this._repository);

  Future<User> execute({
    required String name,
    String? email,
    String? phone,
    required String password,
    UserRole? role,
  }) {
    return _repository.register(
      name: name,
      email: email,
      phone: phone,
      password: password,
      role: role,
    );
  }
}
