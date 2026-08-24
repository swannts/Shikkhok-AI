import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mobile/features/auth/presentation/pages/login_page.dart';

void main() {
  testWidgets('LoginPage renders welcome title, inputs, and login button',
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
          home: LoginPage(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(find.byType(TextFormField),
        findsNWidgets(2)); // Identifier and Password
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
