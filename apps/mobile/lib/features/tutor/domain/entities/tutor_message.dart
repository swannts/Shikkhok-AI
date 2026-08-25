import 'tutor_citation.dart';

enum TutorMessageRole {
  user,
  assistant,
  system,
}

class TutorMessage {
  final String id;
  final String conversationId;
  final String userId;
  final TutorMessageRole role;
  final String content;
  final List<TutorCitation> citations;
  final String? provider;
  final DateTime createdAt;

  const TutorMessage({
    required this.id,
    required this.conversationId,
    required this.userId,
    required this.role,
    required this.content,
    required this.citations,
    required this.provider,
    required this.createdAt,
  });

  bool get isUser => role == TutorMessageRole.user;
}
