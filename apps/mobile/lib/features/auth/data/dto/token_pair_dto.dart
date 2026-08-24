class TokenPairDto {
  final String accessToken;
  final String refreshToken;

  const TokenPairDto({
    required this.accessToken,
    required this.refreshToken,
  });

  factory TokenPairDto.fromJson(Map<String, dynamic> json) {
    return TokenPairDto(
      accessToken: (json['accessToken'] ?? json['token'] ?? '') as String,
      refreshToken: (json['refreshToken'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
      };
}
