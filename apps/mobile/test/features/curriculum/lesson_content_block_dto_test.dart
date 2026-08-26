import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/curriculum/data/dto/lesson_content_block_dto.dart';
import 'package:mobile/features/curriculum/data/dto/lesson_dto.dart';
import 'package:mobile/features/curriculum/domain/entities/lesson_content_block.dart';

void main() {
  group('Lesson content block DTO parsing', () {
    test('known block types parse into typed DTOs', () {
      final paragraph = LessonContentBlockDto.tryFromJson({
        'id': 'block-1',
        'type': 'paragraph',
        'order': 2,
        'text': 'এটি একটি অনুচ্ছেদ।',
      });

      expect(paragraph, isA<LessonParagraphContentBlockDto>());
      expect(paragraph?.type, LessonContentBlockType.paragraph);
    });

    test('unknown block types are skipped rather than rewritten', () {
      final unknown = LessonContentBlockDto.tryFromJson({
        'id': 'block-x',
        'type': 'video',
        'order': 3,
        'url': 'https://example.com/video.mp4',
      });

      expect(unknown, isNull);
      expect(
        () => LessonContentBlockDto.fromJson({
          'id': 'block-x',
          'type': 'video',
          'order': 3,
          'url': 'https://example.com/video.mp4',
        }),
        throwsFormatException,
      );
    });

    test('LessonDto.fromJson skips unknown content blocks', () {
      final lesson = LessonDto.fromJson({
        '_id': 'lesson-1',
        'chapterId': 'chapter-1',
        'title': 'পাঠ ১',
        'slug': 'lesson-1',
        'contentBlocks': [
          {
            'id': 'block-1',
            'type': 'heading',
            'order': 1,
            'text': 'শিরোনাম',
            'level': 2,
          },
          {
            'id': 'block-2',
            'type': 'video',
            'order': 2,
            'url': 'https://example.com/video.mp4',
          },
          {
            'id': 'block-3',
            'type': 'paragraph',
            'order': 3,
            'text': 'আসল অনুচ্ছেদ',
          },
        ],
      });

      expect(lesson.contentBlocks, hasLength(2));
      expect(lesson.contentBlocks.first.type, LessonContentBlockType.heading);
      expect(lesson.contentBlocks.last.type, LessonContentBlockType.paragraph);
      expect(
        lesson.contentBlocks.any((block) => block.id == 'block-2'),
        isFalse,
      );
    });
  });
}
