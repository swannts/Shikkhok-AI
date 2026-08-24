import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:mobile/app/theme/app_theme.dart';
import 'package:mobile/features/analytics/presentation/pages/student_progress_dashboard_page.dart';
import 'package:mobile/features/curriculum/presentation/pages/learn_page.dart';
import 'package:mobile/features/home/presentation/pages/home_page.dart';
import 'package:mobile/features/profile/presentation/pages/student_profile_page.dart';
import 'package:mobile/features/tutor/presentation/pages/ai_tutor_chat_page.dart';

Widget createTestApp(Widget home) {
  return ProviderScope(
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
      await tester.pumpAndSettle();

      expect(find.textContaining('সুপ্রভাত'), findsOneWidget);
      expect(find.text('আজকের অগ্রগতি'), findsOneWidget);
      expect(find.text('আজকের পড়াশোনা'), findsOneWidget);
    });

    testWidgets('LearnPage renders search input and subject cards',
        (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const LearnPage()));
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

      expect(find.text('আরিফুর রহমান'), findsOneWidget);
      expect(find.text('Shikkhok Plus (প্রিমিয়াম)'), findsOneWidget);
    });

    testWidgets('StudentProgressDashboardPage renders mastery overview',
        (WidgetTester tester) async {
      await tester
          .pumpWidget(createTestApp(const StudentProgressDashboardPage()));
      await tester.pumpAndSettle();

      expect(find.text('আমার অগ্রগতি'), findsOneWidget);
      expect(find.text('৭৮%'), findsOneWidget);
    });
  });
}
