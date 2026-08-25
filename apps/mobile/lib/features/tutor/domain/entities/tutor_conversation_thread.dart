import 'tutor_conversation.dart';
import 'tutor_message.dart';

class TutorConversationThread {
  final TutorConversation conversation;
  final List<TutorMessage> messages;
  final String? nextCursor;
  final bool hasNext;

  const TutorConversationThread({
    required this.conversation,
    required this.messages,
    required this.nextCursor,
    required this.hasNext,
  });
}
