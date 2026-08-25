import 'tutor_citation_dto.dart';

class TutorMessageDto {
  final String id;
  final String conversationId;
  final String userId;
  final String role;
  final String content;
  final List<TutorCitationDto> citations;
  final String? provider;
  final String? createdAt;

  const TutorMessageDto({
    required this.id,
    required this.conversationId,
    required this.userId,
    required this.role,
    required this.content,
    required this.citations,
    required this.provider,
    required this.createdAt,
  });

  factory TutorMessageDto.fromJson(Map<String, dynamic> json) {
    return TutorMessageDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      conversationId: (json['conversationId'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      role: (json['role'] ?? 'user').toString(),
      content: (json['content'] ?? '').toString(),
      citations: (json['citations'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(TutorCitationDto.fromJson)
          .toList(),
      provider: json['provider']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
