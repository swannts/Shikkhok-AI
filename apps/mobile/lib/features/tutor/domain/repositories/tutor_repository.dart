import '../entities/tutor_conversation.dart';
import '../entities/tutor_conversation_thread.dart';

abstract interface class TutorRepository {
  Future<List<TutorConversation>> getMyConversations();

  Future<TutorConversationThread> startConversation({
    String? title,
    String? subjectId,
    String? chapterId,
    String? lessonId,
    String? initialMessage,
  });

  Future<TutorConversationThread> getConversation(
    String conversationId, {
    int limit,
    String? cursor,
  });

  Future<TutorConversationThread> getConversationMessages(
    String conversationId, {
    int limit,
    String? cursor,
  });

  Future<TutorConversationThread> sendMessage(
    String conversationId,
    String content,
  );
}
