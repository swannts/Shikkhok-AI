import 'user_dto.dart';
import 'token_pair_dto.dart';

class AuthResponseDto {
  final UserDto user;
  final TokenPairDto tokens;

  const AuthResponseDto({
    required this.user,
    required this.tokens,
  });

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] as Map<String, dynamic>? ?? {};
    final tokensJson = json['tokens'] as Map<String, dynamic>? ?? {};

    return AuthResponseDto(
      user: UserDto.fromJson(userJson),
      tokens: TokenPairDto.fromJson(tokensJson),
    );
  }

  Map<String, dynamic> toJson() => {
        'user': user.toJson(),
        'tokens': tokens.toJson(),
      };
}
