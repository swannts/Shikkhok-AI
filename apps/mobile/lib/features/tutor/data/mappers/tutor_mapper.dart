import '../../domain/entities/tutor_citation.dart';
import '../../domain/entities/tutor_conversation.dart';
import '../../domain/entities/tutor_conversation_thread.dart';
import '../../domain/entities/tutor_message.dart';
import '../dto/tutor_citation_dto.dart';
import '../dto/tutor_conversation_dto.dart';
import '../dto/tutor_message_dto.dart';

class TutorMapper {
  static TutorConversation toConversation(TutorConversationDto dto) {
    return TutorConversation(
      id: dto.id,
      title: dto.title,
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      lessonId: dto.lessonId,
      classLevel: dto.classLevel,
      medium: dto.medium,
      curriculumYear: dto.curriculumYear,
      messageCount: dto.messageCount,
      lastMessageAt: _parseDate(dto.lastMessageAt),
      createdAt: _parseDate(dto.createdAt),
      updatedAt: _parseDate(dto.updatedAt),
    );
  }

  static TutorConversationThread toThread(TutorConversationDto dto) {
    return TutorConversationThread(
      conversation: toConversation(dto),
      messages: dto.messages.map(_toMessage).toList(),
      nextCursor: dto.nextCursor,
      hasNext: dto.hasNext,
    );
  }

  static TutorMessage _toMessage(TutorMessageDto dto) {
    return TutorMessage(
      id: dto.id,
      conversationId: dto.conversationId,
      userId: dto.userId,
      role: _parseRole(dto.role),
      content: dto.content,
      citations: dto.citations.map(toCitation).toList(),
      provider: dto.provider,
      createdAt: _parseDate(dto.createdAt) ?? DateTime.now(),
    );
  }

  static TutorCitation toCitation(TutorCitationDto dto) {
    return TutorCitation(
      sourceId: dto.sourceId,
      sourceBook: dto.sourceBook,
      classLevel: dto.classLevel,
      subject: dto.subject,
      chapter: dto.chapter,
      pageNumber: dto.pageNumber,
      excerpt: dto.excerpt,
      sourceUrl: dto.sourceUrl,
    );
  }

  static TutorMessageRole _parseRole(String value) {
    switch (value.toLowerCase()) {
      case 'assistant':
        return TutorMessageRole.assistant;
      case 'system':
        return TutorMessageRole.system;
      case 'user':
      default:
        return TutorMessageRole.user;
    }
  }

  static DateTime? _parseDate(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }
    try {
      return DateTime.parse(value);
    } catch (_) {
      return null;
    }
  }
}
