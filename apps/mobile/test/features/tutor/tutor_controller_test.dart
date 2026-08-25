import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_citation.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_conversation.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_conversation_thread.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_message.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_stream_event.dart';
import 'package:mobile/features/tutor/domain/repositories/tutor_repository.dart';
import 'package:mobile/features/tutor/presentation/controllers/tutor_controller.dart';

class FakeTutorRepository implements TutorRepository {
  @override
  Future<List<TutorConversation>> getMyConversations() async {
    return [
      TutorConversation(
        id: 'conv-1',
        title: 'বীজগণিত প্রস্তুতি',
        classLevel: 8,
        curriculumYear: '2026',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  @override
  Future<TutorConversationThread> getConversation(
    String conversationId, {
    int limit = 30,
    String? cursor,
  }) async {
    return TutorConversationThread(
      conversation: TutorConversation(
        id: conversationId,
        title: 'বীজগণিত প্রস্তুতি',
        classLevel: 8,
        curriculumYear: '2026',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      messages: [
        TutorMessage(
          id: 'msg-1',
          role: TutorMessageRole.user,
          content: 'সমীকরণ কীভাবে সমাধান করব?',
          createdAt: DateTime.now(),
          citations: const [],
        ),
      ],
    );
  }

  @override
  Future<TutorConversationThread> getConversationMessages(
    String conversationId, {
    int limit = 30,
    String? cursor,
  }) async {
    return getConversation(conversationId);
  }

  @override
  Future<TutorConversationThread> sendMessage(
    String conversationId,
    String content,
  ) async {
    return TutorConversationThread(
      conversation: TutorConversation(
        id: conversationId,
        title: 'বীজগণিত প্রস্তুতি',
        classLevel: 8,
        curriculumYear: '2026',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      messages: [
        TutorMessage(
          id: 'msg-1',
          role: TutorMessageRole.user,
          content: content,
          createdAt: DateTime.now(),
          citations: const [],
        ),
        TutorMessage(
          id: 'msg-2',
          role: TutorMessageRole.assistant,
          content: 'উভয় পক্ষে সংখ্যা যোগ বা বিয়োগ করে সমাধান করুন।',
          createdAt: DateTime.now(),
          citations: const [],
        ),
      ],
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
    return getConversation('conv-1');
  }

  @override
  Stream<TutorStreamEvent> streamMessage(
    String conversationId,
    String content, {
    CancelToken? cancelToken,
  }) async* {
    yield const TutorTextDeltaEvent('উভয় ');
    yield const TutorTextDeltaEvent('পক্ষে যোগ করুন।');
    yield const TutorCitationEvent(
      TutorCitation(
        sourceId: 'src-1',
        sourceBook: 'গণিত ৮ম শ্রেণি',
        classLevel: 8,
        subject: 'গণিত',
        chapter: 'সমীকরণ',
        pageNumber: 45,
        excerpt: 'সমীকরণের উভয় পক্ষে সমান সংখ্যা যোগ করা যায়',
        sourceUrl: null,
      ),
    );
    yield const TutorDoneEvent();
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TutorController Unit Tests', () {
    late TutorController controller;
    late FakeTutorRepository repository;

    setUp(() {
      repository = FakeTutorRepository();
      controller = TutorController(repository);
    });

    test('TutorController loads conversations and opens the latest thread',
        () async {
      await controller.loadInitial();

      expect(controller.state.isLoading, isFalse);
      expect(controller.state.conversations.length, 1);
      expect(controller.state.activeConversation?.id, 'conv-1');
      expect(controller.state.messages.length, 1);
    });

    test('TutorController sends a message and appends assistant reply',
        () async {
      await controller.loadInitial();
      await controller.sendMessage('সমীকরণ কীভাবে করব?');

      expect(controller.state.isSending, isFalse);
      expect(controller.state.messages.length, 2);
      expect(controller.state.messages.last.role, TutorMessageRole.assistant);
    });

    test('streamMessage streams text deltas and preserves citations', () async {
      await controller.loadInitial();
      await controller.streamMessage('কিভাবে সমীকরণ সমাধান করব?');

      expect(controller.state.isStreaming, isFalse);
      expect(controller.state.activeCitations.length, 1);
      expect(
          controller.state.activeCitations.first.sourceBook, contains('গণিত'));
      expect(controller.state.messages.last.content,
          contains('উভয় পক্ষে যোগ করুন।'));
    });

    test('stopGeneration cancels active streaming', () async {
      await controller.loadInitial();
      controller.streamMessage('পরীক্ষা');
      controller.stopGeneration();

      expect(controller.state.isStreaming, isFalse);
    });
  });
}
