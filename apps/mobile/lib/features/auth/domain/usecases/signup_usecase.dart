import '../repositories/auth_repository.dart';

class SignupUseCase {
  final AuthRepository _repository;
  SignupUseCase(this._repository);

  Future<String> execute({required String name, required String phoneOrEmail, required String password}) {
    return _repository.signup(name: name, phoneOrEmail: phoneOrEmail, password: password);
  }
}
