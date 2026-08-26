import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/curriculum/domain/entities/chapter.dart';
import 'package:mobile/features/curriculum/domain/entities/chapter_progress.dart';
import 'package:mobile/features/curriculum/domain/entities/lesson.dart';
import 'package:mobile/features/curriculum/domain/entities/subject.dart';
import 'package:mobile/features/curriculum/presentation/controllers/curriculum_controller.dart';

void main() {
  group('ChapterDetailsViewData Progress Tests', () {
    const testChapter = Chapter(
      id: 'ch_math_01',
      subjectId: 'sub_math_01',
      title: 'অধ্যায় ১: বাস্তব সংখ্যা',
      slug: 'real-numbers',
    );

    const testSubject = Subject(
      id: 'sub_math_01',
      name: 'গণিত',
      slug: 'math',
      classLevel: 8,
      medium: 'bangla',
    );

    test('0 lessons with explicit progress yields 0% progress', () {
      const viewData = ChapterDetailsViewData(
        chapter: testChapter,
        subject: testSubject,
        lessons: [],
        progress: ChapterProgress(
          chapterId: 'ch_math_01',
          totalLessons: 0,
          completedLessons: 0,
          completionRate: 0.0,
        ),
      );

      expect(viewData.totalLessons, 0);
      expect(viewData.completedLessons, 0);
      expect(viewData.progressPercent, 0.0);
      expect(viewData.progressAvailable, isTrue);
    });

    test('4 lessons with 2 complete yields 50% progress', () {
      final lessons = List.generate(
        4,
        (i) => Lesson(
          id: 'lesson_$i',
          chapterId: 'ch_math_01',
          title: 'পাঠ $i',
          slug: 'lesson-$i',
        ),
      );

      final viewData = ChapterDetailsViewData(
        chapter: testChapter,
        subject: testSubject,
        lessons: lessons,
        progress: ChapterProgress(
          chapterId: 'ch_math_01',
          totalLessons: lessons.length,
          completedLessons: 2,
          completionRate: 50.0,
        ),
      );

      expect(viewData.totalLessons, 4);
      expect(viewData.completedLessons, 2);
      expect(viewData.progressPercent, 50.0);
      expect(viewData.progressAvailable, isTrue);
    });

    test('all lessons complete yields 100% progress', () {
      final lessons = List.generate(
        5,
        (i) => Lesson(
          id: 'lesson_$i',
          chapterId: 'ch_math_01',
          title: 'পাঠ $i',
          slug: 'lesson-$i',
        ),
      );

      final viewData = ChapterDetailsViewData(
        chapter: testChapter,
        subject: testSubject,
        lessons: lessons,
        progress: const ChapterProgress(
          chapterId: 'ch_math_01',
          totalLessons: 5,
          completedLessons: 5,
          completionRate: 100.0,
        ),
      );

      expect(viewData.totalLessons, 5);
      expect(viewData.completedLessons, 5);
      expect(viewData.progressPercent, 100.0);
      expect(viewData.progressAvailable, isTrue);
    });

    test('missing progress stays unavailable without fake percentages', () {
      const lessons = [
        Lesson(
          id: 'lesson_new_1',
          chapterId: 'ch_math_01',
          title: 'নতুন পাঠ',
          slug: 'new-lesson',
        )
      ];

      const viewData = ChapterDetailsViewData(
        chapter: testChapter,
        subject: testSubject,
        lessons: lessons,
        progress: null,
      );

      expect(viewData.completedLessons, 0);
      expect(viewData.totalLessons, lessons.length);
      expect(viewData.progressPercent, isNull);
      expect(viewData.progressAvailable, isFalse);
    });

    test('zero progress remains real when API returns a progress payload', () {
      final lessons = List.generate(
        3,
        (i) => Lesson(
          id: 'lesson_$i',
          chapterId: 'ch_math_01',
          title: 'পাঠ $i',
          slug: 'lesson-$i',
        ),
      );

      final viewData = ChapterDetailsViewData(
        chapter: testChapter,
        subject: testSubject,
        lessons: lessons,
        progress: const ChapterProgress(
          chapterId: 'ch_math_01',
          totalLessons: 3,
          completedLessons: 0,
          completionRate: 0.0,
        ),
      );

      expect(viewData.totalLessons, 3);
      expect(viewData.completedLessons, 0);
      expect(viewData.progressPercent, 0.0);
      expect(viewData.progressAvailable, isTrue);
    });
  });
}
