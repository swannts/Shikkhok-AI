import '../../domain/entities/user.dart';
import '../dto/user_dto.dart';

extension UserDtoMapper on UserDto {
  User toDomain() {
    return User(
      id: id,
      userId: userId,
      name: name,
      classId: classId,
      className: className,
      language: language,
    );
  }
}
