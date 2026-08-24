import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mobile/features/auth/presentation/pages/signup_page.dart';

void main() {
  testWidgets(
      'SignupPage renders role chips, form inputs, and registration CTA',
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
          home: SignupPage(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(SignupPage), findsOneWidget);
    expect(
        find.byType(ChoiceChip), findsNWidgets(2)); // Student and Parent roles
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
