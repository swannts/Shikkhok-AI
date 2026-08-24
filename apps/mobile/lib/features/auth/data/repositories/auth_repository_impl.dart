import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../dto/user_dto.dart';
import '../mappers/auth_mapper.dart';
import '../../../../core/storage/token_storage.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  AuthRepositoryImpl(this._remoteDataSource);

  @override
  Future<User> login({required String identifier, required String password}) async {
    final res = await _remoteDataSource.login(identifier, password);
    final token = res['token'] as String;
    await TokenStorage.setAccessToken(token);
    if (res['refreshToken'] != null) {
      await TokenStorage.setRefreshToken(res['refreshToken']);
    }
    final userDto = UserDto.fromJson(res['user']);
    return userDto.toDomain();
  }

  @override
  Future<String> signup({required String name, required String phoneOrEmail, required String password}) async {
    final res = await _remoteDataSource.signup(name, phoneOrEmail, password);
    return res['referenceId'] ?? 'ref-123';
  }

  @override
  Future<User> verifyOtp({required String referenceId, required String otp}) async {
    final res = await _remoteDataSource.verifyOtp(referenceId, otp);
    final token = res['token'] as String;
    await TokenStorage.setAccessToken(token);
    if (res['refreshToken'] != null) {
      await TokenStorage.setRefreshToken(res['refreshToken']);
    }
    final userDto = UserDto.fromJson(res['user']);
    return userDto.toDomain();
  }

  @override
  Future<User> getCurrentUser() async {
    final userDto = await _remoteDataSource.getCurrentUser();
    return userDto.toDomain();
  }

  @override
  Future<void> logout() async {
    await _remoteDataSource.logout();
    await TokenStorage.clearTokens();
  }
}
