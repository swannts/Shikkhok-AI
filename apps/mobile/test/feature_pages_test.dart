import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:mobile/app/theme/app_theme.dart';
import 'package:mobile/features/analytics/presentation/pages/student_progress_dashboard_page.dart';
import 'package:mobile/features/curriculum/domain/entities/subject.dart';
import 'package:mobile/features/curriculum/domain/entities/chapter.dart';
import 'package:mobile/features/curriculum/domain/entities/lesson.dart';
import 'package:mobile/features/curriculum/domain/entities/progress_summary.dart';
import 'package:mobile/features/curriculum/domain/entities/chapter_progress.dart';
import 'package:mobile/features/curriculum/domain/repositories/curriculum_repository.dart';
import 'package:mobile/features/curriculum/presentation/controllers/curriculum_controller.dart';
import 'package:mobile/features/curriculum/presentation/pages/learn_page.dart';
import 'package:mobile/features/home/domain/entities/gamification_summary.dart';
import 'package:mobile/features/home/presentation/controllers/home_dashboard_controller.dart';
import 'package:mobile/features/home/presentation/pages/home_page.dart';
import 'package:mobile/features/profile/domain/entities/student_profile.dart';
import 'package:mobile/features/profile/presentation/pages/student_profile_page.dart';
import 'package:mobile/features/tutor/presentation/pages/ai_tutor_chat_page.dart';

class FakeCurriculumRepository implements CurriculumRepository {
  @override
  Future<List<Subject>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  }) async {
    return const [
      Subject(
        id: 's-1',
        name: 'গণিত',
        slug: 'math',
        classLevel: 8,
        medium: 'bangla',
      ),
      Subject(
        id: 's-2',
        name: 'বিজ্ঞান',
        slug: 'science',
        classLevel: 8,
        medium: 'bangla',
      ),
    ];
  }

  @override
  Future<Subject> getSubject(String subjectId) async {
    return const Subject(
      id: 's-1',
      name: 'গণিত',
      slug: 'math',
      classLevel: 8,
      medium: 'bangla',
    );
  }

  @override
  Future<List<Chapter>> listChapters(String subjectId) async => const [];

  @override
  Future<Chapter> getChapter(String chapterId) async => const Chapter(
        id: 'c-1',
        subjectId: 's-1',
        title: 'অধ্যায় ১',
        slug: 'chapter-1',
      );

  @override
  Future<List<Lesson>> listLessons(String chapterId) async => const [];

  @override
  Future<Lesson> getLesson(String lessonId) async => const Lesson(
        id: 'l-1',
        chapterId: 'c-1',
        title: 'পাঠ ১',
        slug: 'lesson-1',
      );

  @override
  Future<ProgressSummary> getMyProgressSummary() async =>
      const ProgressSummary();

  @override
  Future<List<ChapterProgress>> getMySubjectProgress(String subjectId) async =>
      const [];

  @override
  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  }) async {}
}

Widget createTestApp(
  Widget home, {
  List<Override> overrides = const [],
}) {
  return ProviderScope(
    overrides: [
      curriculumRepositoryProvider
          .overrideWithValue(FakeCurriculumRepository()),
      homeDashboardProvider.overrideWith((ref) => Future.value(
            const HomeDashboardData(
              profile: StudentProfile(
                id: 'p-1',
                userId: 'u-1',
                classLevel: 8,
                medium: StudentMediumType.bangla,
              ),
              subjects: [
                Subject(
                  id: 's-1',
                  name: 'গণিত',
                  slug: 'math',
                  classLevel: 8,
                  medium: 'bangla',
                ),
                Subject(
                  id: 's-2',
                  name: 'বিজ্ঞান',
                  slug: 'science',
                  classLevel: 8,
                  medium: 'bangla',
                ),
              ],
              gamification:
                  GamificationSummary(streakDays: 7, totalPoints: 350),
            ),
          )),
      ...overrides,
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
      home: home,
    ),
  );
}

void main() {
  group('Core Feature Pages Widget Tests', () {
    testWidgets('HomePage renders greeting and progress overview card',
        (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const HomePage()));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      expect(find.textContaining('সুপ্রভাত'), findsOneWidget);
      expect(find.text('আজকের অগ্রগতি'), findsOneWidget);
      expect(find.text('আজকের পড়াশোনা'), findsOneWidget);
    });

    testWidgets('LearnPage renders search input and subject cards',
        (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const LearnPage()));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      expect(find.byType(LearnPage), findsOneWidget);
      expect(find.text('গণিত'), findsOneWidget);
      expect(find.text('বিজ্ঞান'), findsOneWidget);
    });

    testWidgets('AiTutorChatPage renders header and message bubbles',
        (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const AiTutorChatPage()));
      await tester.pumpAndSettle();

      expect(find.text('AI শিক্ষক'), findsWidgets);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('StudentProfilePage renders student avatar and menu items',
        (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const StudentProfilePage()));
      await tester.pumpAndSettle();

      expect(find.byType(StudentProfilePage), findsOneWidget);
      expect(find.text('শিক্ষার্থী'), findsOneWidget);
      expect(find.text('Shikkhok Plus (প্রিমিয়াম)'), findsOneWidget);
    });

    testWidgets('StudentProgressDashboardPage renders mastery overview',
        (WidgetTester tester) async {
      await tester
          .pumpWidget(createTestApp(const StudentProgressDashboardPage()));
      await tester.pumpAndSettle();

      expect(find.text('আমার অগ্রগতি'), findsOneWidget);
      expect(find.text('গণিত'), findsOneWidget);
    });
  });
}
