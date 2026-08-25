import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mobile/features/setup/presentation/pages/goal_setting_page.dart';

void main() {
  testWidgets('GoalSettingPage renders goal options and start button',
      (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: [
            Locale('bn'),
            Locale('en'),
          ],
          locale: Locale('bn'),
          home: GoalSettingPage(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(GoalSettingPage), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
