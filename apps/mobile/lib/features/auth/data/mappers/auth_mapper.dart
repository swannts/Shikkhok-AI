import '../../domain/entities/user.dart';
import '../dto/user_dto.dart';
import 'user_mapper.dart';

extension UserDtoMapper on UserDto {
  User toDomain() {
    return UserMapper.toDomain(this);
  }
}
