import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_citation.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_conversation.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_conversation_thread.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_message.dart';
import 'package:mobile/features/tutor/domain/repositories/tutor_repository.dart';
import 'package:mobile/features/tutor/presentation/controllers/tutor_controller.dart';
import 'package:mobile/features/tutor/presentation/state/tutor_state.dart';

class FakeTutorRepository implements TutorRepository {
  FakeTutorRepository()
      : _conversation = const TutorConversation(
          id: 'conv-1',
          title: 'বীজগণিত',
          subjectId: 'sub-1',
          chapterId: null,
          lessonId: null,
          classLevel: 8,
          medium: 'bangla',
          curriculumYear: '2026',
          messageCount: 0,
          lastMessageAt: null,
          createdAt: null,
          updatedAt: null,
        );

  final TutorConversation _conversation;
  final List<TutorMessage> _messages = [];

  @override
  Future<List<TutorConversation>> getMyConversations() async => [_conversation];

  @override
  Future<TutorConversationThread> getConversation(
    String conversationId, {
    int limit = 30,
    String? cursor,
  }) async {
    return TutorConversationThread(
      conversation: _conversation,
      messages: List<TutorMessage>.from(_messages),
      nextCursor: null,
      hasNext: false,
    );
  }

  @override
  Future<TutorConversationThread> getConversationMessages(
    String conversationId, {
    int limit = 30,
    String? cursor,
  }) async {
    return getConversation(conversationId, limit: limit, cursor: cursor);
  }

  @override
  Future<TutorConversationThread> sendMessage(
    String conversationId,
    String content,
  ) async {
    final now = DateTime.parse('2026-08-24T12:00:00.000Z');
    _messages.add(
      TutorMessage(
        id: 'msg-user-1',
        conversationId: conversationId,
        userId: 'user-1',
        role: TutorMessageRole.user,
        content: content,
        citations: const [],
        provider: null,
        createdAt: now,
      ),
    );
    _messages.add(
      TutorMessage(
        id: 'msg-assistant-1',
        conversationId: conversationId,
        userId: 'user-1',
        role: TutorMessageRole.assistant,
        content: 'চলো ধাপে ধাপে করি।',
        citations: const [
          TutorCitation(
            sourceId: 'lesson-1',
            sourceBook: 'NCTB',
            classLevel: 8,
            subject: 'Math',
            chapter: 'Algebra',
            pageNumber: 42,
            excerpt: 'Linear equations',
            sourceUrl: null,
          ),
        ],
        provider: 'gemini',
        createdAt: now,
      ),
    );
    return TutorConversationThread(
      conversation: _conversation,
      messages: List<TutorMessage>.from(_messages),
      nextCursor: null,
      hasNext: false,
    );
  }

  @override
  Future<TutorConversationThread> startConversation({
    String? title,
    String? subjectId,
    String? chapterId,
    String? lessonId,
    String? initialMessage,
  }) async {
    if (initialMessage != null && initialMessage.isNotEmpty) {
      return sendMessage(_conversation.id, initialMessage);
    }

    return TutorConversationThread(
      conversation: _conversation,
      messages: const [],
      nextCursor: null,
      hasNext: false,
    );
  }
}

void main() {
  group('TutorController', () {
    test('loads conversations and opens the latest thread', () async {
      final controller = TutorController(FakeTutorRepository());

      await controller.loadInitial();

      expect(controller.state, isA<TutorState>());
      expect(controller.state.activeConversation?.id, 'conv-1');
      expect(controller.state.conversations, hasLength(1));
      expect(controller.state.isLoading, isFalse);
    });

    test('sends a message and appends assistant reply', () async {
      final controller = TutorController(FakeTutorRepository());

      await controller.loadInitial();
      await controller.sendMessage('2x + 5 = 15 কীভাবে সমাধান করবো?');

      expect(controller.state.messages, hasLength(2));
      expect(controller.state.messages.last.role, TutorMessageRole.assistant);
      expect(controller.state.messages.last.citations, hasLength(1));
      expect(controller.state.isSending, isFalse);
    });
  });
}
