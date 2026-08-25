import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tutor/data/dto/tutor_conversation_dto.dart';
import 'package:mobile/features/tutor/data/mappers/tutor_mapper.dart';
import 'package:mobile/features/tutor/domain/entities/tutor_message.dart';

void main() {
  group('TutorMapper', () {
    test('maps conversation payload with messages and citations', () {
      final dto = TutorConversationDto.fromJson({
        '_id': 'conv-1',
        'title': 'বীজগণিত',
        'subjectId': 'sub-1',
        'chapterId': 'chap-1',
        'lessonId': 'les-1',
        'classLevel': 8,
        'medium': 'bangla',
        'curriculumYear': '2026',
        'messageCount': 2,
        'lastMessageAt': '2026-08-24T11:30:00.000Z',
        'createdAt': '2026-08-24T11:00:00.000Z',
        'updatedAt': '2026-08-24T11:30:00.000Z',
        'messages': [
          {
            '_id': 'msg-1',
            'conversationId': 'conv-1',
            'userId': 'user-1',
            'role': 'user',
            'content': '2x + 5 = 15 কীভাবে সমাধান করবো?',
            'citations': const [],
            'provider': null,
            'createdAt': '2026-08-24T11:20:00.000Z',
          },
          {
            '_id': 'msg-2',
            'conversationId': 'conv-1',
            'userId': 'user-1',
            'role': 'assistant',
            'content': 'চলো ধাপে ধাপে করি।',
            'citations': [
              {
                'sourceBook': 'NCTB',
                'sourceId': 'lesson-1',
                'classLevel': 8,
                'subject': 'Math',
                'chapter': 'Algebra',
                'pageNumber': 42,
                'excerpt': 'Linear equations',
              },
            ],
            'provider': 'gemini',
            'createdAt': '2026-08-24T11:21:00.000Z',
          },
        ],
        'messageMeta': {
          'nextCursor': 'cursor-abc',
          'hasNext': true,
        },
      });

      final thread = TutorMapper.toThread(dto);

      expect(thread.conversation.id, 'conv-1');
      expect(thread.messages, hasLength(2));
      expect(thread.messages.first.role, TutorMessageRole.user);
      expect(thread.messages.last.role, TutorMessageRole.assistant);
      expect(thread.messages.last.citations, hasLength(1));
      expect(thread.nextCursor, 'cursor-abc');
      expect(thread.hasNext, isTrue);
    });
  });
}
