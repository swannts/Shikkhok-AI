import '../../domain/entities/user.dart';
import '../../domain/entities/token_pair.dart';
import '../dto/user_dto.dart';
import '../dto/token_pair_dto.dart';

class UserMapper {
  static User toDomain(UserDto dto) {
    DateTime? parsedDate;
    if (dto.createdAt != null) {
      try {
        parsedDate = DateTime.parse(dto.createdAt!);
      } catch (_) {}
    }

    return User(
      id: dto.id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: UserRole.fromString(dto.role),
      status: dto.status,
      avatarUrl: dto.avatarUrl,
      createdAt: parsedDate,
    );
  }

  static UserDto toDto(User entity) {
    return UserDto(
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      role: entity.role.toApiString(),
      status: entity.status,
      avatarUrl: entity.avatarUrl,
      createdAt: entity.createdAt?.toIso8601String(),
    );
  }

  static TokenPair tokenPairToDomain(TokenPairDto dto) {
    return TokenPair(
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
    );
  }
}
