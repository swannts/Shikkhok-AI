import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:mobile/app/theme/app_theme.dart';
import 'package:mobile/features/curriculum/domain/entities/subject.dart';
import 'package:mobile/features/curriculum/domain/entities/chapter.dart';
import 'package:mobile/features/curriculum/domain/entities/lesson.dart';
import 'package:mobile/features/curriculum/domain/entities/lesson_content_block.dart';
import 'package:mobile/features/curriculum/domain/entities/progress_summary.dart';
import 'package:mobile/features/curriculum/domain/entities/chapter_progress.dart';
import 'package:mobile/features/curriculum/domain/repositories/curriculum_repository.dart';
import 'package:mobile/features/curriculum/presentation/controllers/curriculum_controller.dart';
import 'package:mobile/features/curriculum/presentation/pages/subject_details_page.dart';
import 'package:mobile/features/curriculum/presentation/pages/chapter_details_page.dart';
import 'package:mobile/features/curriculum/presentation/pages/lesson_reader_page.dart';

class MockCurriculumRepo implements CurriculumRepository {
  final bool returnEmpty;
  final bool shouldThrow;
  final bool progressShouldThrow;
  final bool progressReturnsEmpty;

  MockCurriculumRepo({
    this.returnEmpty = false,
    this.shouldThrow = false,
    this.progressShouldThrow = false,
    this.progressReturnsEmpty = false,
  });

  @override
  Future<List<Subject>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  }) async {
    if (shouldThrow) throw Exception('Network error');
    if (returnEmpty) return [];
    return const [
      Subject(
        id: 'real_sub_101',
        name: 'উচ্চতর গণিত',
        slug: 'higher-math',
        classLevel: 9,
        medium: 'bangla',
      ),
    ];
  }

  @override
  Future<Subject> getSubject(String subjectId) async {
    if (shouldThrow) throw Exception('Network error');
    return Subject(
      id: subjectId,
      name: 'উচ্চতর গণিত',
      slug: 'higher-math',
      classLevel: 9,
      medium: 'bangla',
    );
  }

  @override
  Future<List<Chapter>> listChapters(String subjectId) async {
    if (shouldThrow) throw Exception('Network error');
    if (returnEmpty) return [];
    return [
      Chapter(
        id: 'real_chap_201',
        subjectId: subjectId,
        title: 'সেট ও ফাংশন',
        slug: 'sets-and-functions',
        estimatedMinutes: 45,
        order: 1,
      ),
    ];
  }

  @override
  Future<Chapter> getChapter(String chapterId) async {
    if (shouldThrow) throw Exception('Network error');
    return Chapter(
      id: chapterId,
      subjectId: 'real_sub_101',
      title: 'সেট ও ফাংশন',
      slug: 'sets-and-functions',
      estimatedMinutes: 45,
      order: 1,
    );
  }

  @override
  Future<List<Lesson>> listLessons(String chapterId) async {
    if (shouldThrow) throw Exception('Network error');
    if (returnEmpty) return [];
    return [
      Lesson(
        id: 'real_les_301',
        chapterId: chapterId,
        title: 'সার্বিক সেট ও উপসেট',
        slug: 'universal-sets',
        summary: 'সেটের মৌলিক বিষয়াবলি ও উপসেট গঠন।',
        textbookReference: 'অধ্যায় ১, পৃষ্ঠা ৫-১২',
        pageStart: 5,
        pageEnd: 12,
        order: 1,
        contentBlocks: const [
          LessonHeadingContentBlock(
            id: 'block-1',
            order: 1,
            text: 'সার্বিক সেট',
            level: 2,
          ),
          LessonParagraphContentBlock(
            id: 'block-2',
            order: 2,
            text:
                'একটি নির্দিষ্ট আলোচনার সকল উপাদানের সমষ্টিকে সার্বিক সেট বলে।',
          ),
          LessonFormulaContentBlock(
            id: 'block-3',
            order: 3,
            expression: 'U = \\{x : x \\text{ belongs to the discussion}\\}',
            description: 'সার্বিক সেটের প্রতীকী রূপ',
          ),
          LessonImportantNoteContentBlock(
            id: 'block-4',
            order: 4,
            title: 'মনে রাখবে',
            text:
                'উদাহরণভিত্তিক উপসেট নির্ধারণে সার্বিক সেটকে ভিত্তি হিসেবে ধরতে হয়।',
            severity: LessonImportantNoteSeverity.tip,
          ),
        ],
      ),
    ];
  }

  @override
  Future<Lesson> getLesson(String lessonId) async {
    if (shouldThrow) throw Exception('Network error');
    return Lesson(
      id: lessonId,
      chapterId: 'real_chap_201',
      title: 'সার্বিক সেট ও উপসেট',
      slug: 'universal-sets',
      summary: 'সেটের মৌলিক বিষয়াবলি ও উপসেট গঠন।',
      textbookReference: 'অধ্যায় ১, পৃষ্ঠা ৫-১২',
      pageStart: 5,
      pageEnd: 12,
      order: 1,
      contentBlocks: const [
        LessonHeadingContentBlock(
          id: 'block-1',
          order: 1,
          text: 'সার্বিক সেট',
          level: 2,
        ),
        LessonParagraphContentBlock(
          id: 'block-2',
          order: 2,
          text: 'একটি নির্দিষ্ট আলোচনার সকল উপাদানের সমষ্টিকে সার্বিক সেট বলে।',
        ),
        LessonFormulaContentBlock(
          id: 'block-3',
          order: 3,
          expression: 'U = \\{x : x \\text{ belongs to the discussion}\\}',
          description: 'সার্বিক সেটের প্রতীকী রূপ',
        ),
        LessonImportantNoteContentBlock(
          id: 'block-4',
          order: 4,
          title: 'মনে রাখবে',
          text:
              'উদাহরণভিত্তিক উপসেট নির্ধারণে সার্বিক সেটকে ভিত্তি হিসেবে ধরতে হয়।',
          severity: LessonImportantNoteSeverity.tip,
        ),
      ],
    );
  }

  @override
  Future<ProgressSummary> getMyProgressSummary() async =>
      const ProgressSummary();

  @override
  Future<List<ChapterProgress>> getMySubjectProgress(String subjectId) async {
    if (progressShouldThrow) throw Exception('Network error');
    if (progressReturnsEmpty) return [];
    return [
      const ChapterProgress(
        chapterId: 'real_chap_201',
        totalLessons: 1,
        completedLessons: 0,
        completionRate: 0.0,
      ),
    ];
  }

  @override
  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  }) async {}
}

Widget wrapPage(Widget page, {CurriculumRepository? repo}) {
  return ProviderScope(
    overrides: [
      if (repo != null) curriculumRepositoryProvider.overrideWithValue(repo),
    ],
    child: MaterialApp(
      theme: AppTheme.lightTheme,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      locale: const Locale('bn'),
      home: page,
    ),
  );
}

void main() {
  group('Learning Flow Real Data Integration Tests', () {
    testWidgets(
        'SubjectDetailsPage renders real subject name, metadata, and chapters',
        (tester) async {
      final mockRepo = MockCurriculumRepo();
      await tester.pumpWidget(
        wrapPage(
          const SubjectDetailsPage(subjectId: 'real_sub_101'),
          repo: mockRepo,
        ),
      );
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('উচ্চতর গণিত'), findsWidgets);
      expect(find.text('সেট ও ফাংশন'), findsOneWidget);
      expect(find.text('45 মিনিট'), findsOneWidget);
    });

    testWidgets('SubjectDetailsPage handles invalid ID gracefully',
        (tester) async {
      await tester.pumpWidget(
        wrapPage(const SubjectDetailsPage(subjectId: '')),
      );
      await tester.pumpAndSettle();

      expect(find.text('বিষয়টি খুঁজে পাওয়া যায়নি'), findsOneWidget);
      expect(find.text('ফিরে যান'), findsOneWidget);
    });

    testWidgets(
        'ChapterDetailsPage renders real chapter title, metadata, and real lessons',
        (tester) async {
      final mockRepo = MockCurriculumRepo();
      await tester.pumpWidget(
        wrapPage(
          const ChapterDetailsPage(chapterId: 'real_chap_201'),
          repo: mockRepo,
        ),
      );
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('সেট ও ফাংশন'), findsWidgets);
      expect(find.text('সার্বিক সেট ও উপসেট'), findsOneWidget);
      expect(find.text('পৃষ্ঠা 5-12'), findsOneWidget);
      expect(find.text('0/1 পাঠ সম্পন্ন'), findsOneWidget);
      expect(find.text('0%'), findsOneWidget);
      expect(find.text('অগ্রগতি পাওয়া যাচ্ছে না'), findsNothing);
    });

    testWidgets(
        'ChapterDetailsPage shows unavailable progress when progress API fails',
        (tester) async {
      final mockRepo = MockCurriculumRepo(progressShouldThrow: true);
      await tester.pumpWidget(
        wrapPage(
          const ChapterDetailsPage(chapterId: 'real_chap_201'),
          repo: mockRepo,
        ),
      );
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('সেট ও ফাংশন'), findsWidgets);
      expect(find.text('সার্বিক সেট ও উপসেট'), findsOneWidget);
      expect(find.text('অগ্রগতি পাওয়া যাচ্ছে না'), findsOneWidget);
      expect(find.text('0%'), findsNothing);
      expect(find.text('পুনরায় চেষ্টা করুন'), findsWidgets);
    });

    testWidgets(
        'ChapterDetailsPage treats an empty progress response as real zero progress',
        (tester) async {
      final mockRepo = MockCurriculumRepo(progressReturnsEmpty: true);
      await tester.pumpWidget(
        wrapPage(
          const ChapterDetailsPage(chapterId: 'real_chap_201'),
          repo: mockRepo,
        ),
      );
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('সেট ও ফাংশন'), findsWidgets);
      expect(find.text('সার্বিক সেট ও উপসেট'), findsOneWidget);
      expect(find.text('0/1 পাঠ সম্পন্ন'), findsOneWidget);
      expect(find.text('0%'), findsOneWidget);
      expect(find.text('অগ্রগতি পাওয়া যাচ্ছে না'), findsNothing);
      expect(find.text('পুনরায় চেষ্টা করুন'), findsNothing);
    });

    testWidgets('ChapterDetailsPage handles invalid ID gracefully',
        (tester) async {
      await tester.pumpWidget(
        wrapPage(const ChapterDetailsPage(chapterId: null)),
      );
      await tester.pumpAndSettle();

      expect(find.text('অধ্যায়টি খুঁজে পাওয়া যায়নি'), findsOneWidget);
      expect(find.text('ফিরে যান'), findsOneWidget);
    });

    testWidgets(
        'LessonReaderPage loads real lesson title, summary, and textbook reference',
        (tester) async {
      final mockRepo = MockCurriculumRepo();
      await tester.pumpWidget(
        wrapPage(
          const LessonReaderPage(lessonId: 'real_les_301'),
          repo: mockRepo,
        ),
      );
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('সার্বিক সেট ও উপসেট'), findsWidgets);
      expect(find.text('পাঠের বিষয়বস্তু'), findsOneWidget);
      expect(find.text('সার্বিক সেট'), findsOneWidget);
      expect(find.text('সেটের মৌলিক বিষয়াবলি ও উপসেট গঠন।'), findsOneWidget);
      expect(
        find.text(
            'একটি নির্দিষ্ট আলোচনার সকল উপাদানের সমষ্টিকে সার্বিক সেট বলে।'),
        findsOneWidget,
      );
      expect(
        find.text('U = \\{x : x \\text{ belongs to the discussion}\\}'),
        findsOneWidget,
      );
      expect(
        find.text(
            'উদাহরণভিত্তিক উপসেট নির্ধারণে সার্বিক সেটকে ভিত্তি হিসেবে ধরতে হয়।'),
        findsOneWidget,
      );
      expect(find.text('অধ্যায় ১, পৃষ্ঠা ৫-১২'), findsOneWidget);
      expect(find.text('পাঠ সম্পন্ন করো'), findsOneWidget);
    });

    testWidgets('LessonReaderPage handles invalid ID gracefully',
        (tester) async {
      await tester.pumpWidget(
        wrapPage(const LessonReaderPage(lessonId: '  ')),
      );
      await tester.pumpAndSettle();

      expect(find.text('পাঠটি খুঁজে পাওয়া যায়নি'), findsOneWidget);
      expect(find.text('ফিরে যান'), findsOneWidget);
    });
  });
}
