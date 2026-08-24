import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mobile/features/auth/presentation/pages/verify_otp_page.dart';

void main() {
  testWidgets('VerifyOtpPage renders 6-digit inputs and verify button',
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
          home: VerifyOtpPage(phone: '01711223344'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(VerifyOtpPage), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(6)); // 6 pin boxes
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
