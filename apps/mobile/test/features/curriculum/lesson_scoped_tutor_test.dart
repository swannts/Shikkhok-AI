import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_conversation.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_conversation_thread.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_message.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_stream_event.dart';
import 'package:mobile/features/tutor/domain/repositories/tutor_repository.dart';
import 'package:mobile/features/tutor/presentation/controllers/tutor_controller.dart';

class FakeLessonTutorRepository implements TutorRepository {
  String? capturedTitle;
  String? capturedSubjectId;
  String? capturedChapterId;
  String? capturedLessonId;
  String? capturedInitialMessage;

  @override
  Future<TutorConversationThread> startConversation({
    String? title,
    String? subjectId,
    String? chapterId,
    String? lessonId,
    String? initialMessage,
  }) async {
    capturedTitle = title;
    capturedSubjectId = subjectId;
    capturedChapterId = chapterId;
    capturedLessonId = lessonId;
    capturedInitialMessage = initialMessage;

    return TutorConversationThread(
      conversation: TutorConversation(
        id: 'conv_real_mongo_id_8899',
        title: title ?? 'নতুন আলাপ',
        subjectId: subjectId,
        chapterId: chapterId,
        lessonId: lessonId,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      messages: [
        TutorMessage(
          id: 'msg_1',
          conversationId: 'conv_real_mongo_id_8899',
          role: TutorMessageRole.user,
          content: initialMessage ?? 'সাহায্য প্রয়োজন',
          createdAt: DateTime.now(),
        ),
      ],
    );
  }

  @override
  Future<List<TutorConversation>> getMyConversations() async => [];

  @override
  Future<TutorConversationThread> getConversation(String conversationId,
      {int limit = 30, String? cursor}) async {
    throw UnimplementedError();
  }

  @override
  Future<TutorConversationThread> getConversationMessages(String conversationId,
      {int limit = 30, String? cursor}) async {
    throw UnimplementedError();
  }

  @override
  Future<TutorConversationThread> sendMessage(
      String conversationId, String content) async {
    throw UnimplementedError();
  }

  @override
  Stream<TutorStreamEvent> streamMessage(String conversationId, String content,
      {CancelToken? cancelToken}) {
    throw UnimplementedError();
  }
}

void main() {
  group('Lesson-Scoped AI Tutor Controller Tests', () {
    late FakeLessonTutorRepository fakeRepo;
    late TutorController controller;

    setUp(() {
      fakeRepo = FakeLessonTutorRepository();
      controller = TutorController(fakeRepo);
    });

    test(
        'startConversationForLesson passes real lessonId, chapterId, subjectId and sets active conversation',
        () async {
      final thread = await controller.startConversationForLesson(
        lessonId: '64b8268b6cb348e3b53f8003',
        chapterId: '64b8268b6cb348e3b53f8002',
        subjectId: '64b8268b6cb348e3b53f8001',
        lessonTitle: 'সরল সমীকরণ সমাধান',
      );

      expect(thread, isNotNull);
      expect(fakeRepo.capturedLessonId, '64b8268b6cb348e3b53f8003');
      expect(fakeRepo.capturedChapterId, '64b8268b6cb348e3b53f8002');
      expect(fakeRepo.capturedSubjectId, '64b8268b6cb348e3b53f8001');
      expect(fakeRepo.capturedTitle, 'সরল সমীকরণ সমাধান • পাঠ সহায়তা');
      expect(thread!.conversation.id, 'conv_real_mongo_id_8899');
      expect(
          controller.state.activeConversation?.id, 'conv_real_mongo_id_8899');
    });
  });
}
