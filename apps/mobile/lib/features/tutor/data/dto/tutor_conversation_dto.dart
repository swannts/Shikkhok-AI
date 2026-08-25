import 'tutor_message_dto.dart';

class TutorConversationDto {
  final String id;
  final String title;
  final String? subjectId;
  final String? chapterId;
  final String? lessonId;
  final int classLevel;
  final String? medium;
  final String curriculumYear;
  final int messageCount;
  final String? lastMessageAt;
  final String? createdAt;
  final String? updatedAt;
  final List<TutorMessageDto> messages;
  final String? nextCursor;
  final bool hasNext;

  const TutorConversationDto({
    required this.id,
    required this.title,
    required this.subjectId,
    required this.chapterId,
    required this.lessonId,
    required this.classLevel,
    required this.medium,
    required this.curriculumYear,
    required this.messageCount,
    required this.lastMessageAt,
    required this.createdAt,
    required this.updatedAt,
    required this.messages,
    required this.nextCursor,
    required this.hasNext,
  });

  factory TutorConversationDto.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) {
      if (value is num) {
        return value.toInt();
      }
      return int.tryParse(value?.toString() ?? '') ?? 0;
    }

    Map<String, dynamic> meta = {};
    if (json['messageMeta'] is Map<String, dynamic>) {
      meta = json['messageMeta'] as Map<String, dynamic>;
    } else if (json['meta'] is Map<String, dynamic>) {
      meta = json['meta'] as Map<String, dynamic>;
    }

    final rawMessages = (json['messages'] is List<dynamic>
            ? json['messages'] as List<dynamic>
            : const [])
        .whereType<Map<String, dynamic>>()
        .map(TutorMessageDto.fromJson)
        .toList();

    return TutorConversationDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      subjectId: json['subjectId']?.toString(),
      chapterId: json['chapterId']?.toString(),
      lessonId: json['lessonId']?.toString(),
      classLevel: parseInt(json['classLevel']),
      medium: json['medium']?.toString(),
      curriculumYear: (json['curriculumYear'] ?? '').toString(),
      messageCount: parseInt(json['messageCount']),
      lastMessageAt: json['lastMessageAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      messages: rawMessages,
      nextCursor: meta['nextCursor']?.toString(),
      hasNext: meta['hasNext'] == true,
    );
  }
}
