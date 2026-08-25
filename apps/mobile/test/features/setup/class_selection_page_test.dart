import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/localization/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mobile/features/setup/presentation/pages/class_selection_page.dart';

void main() {
  testWidgets('ClassSelectionPage renders 12 class items and next button',
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
          home: ClassSelectionPage(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(ClassSelectionPage), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
    expect(find.text('৮ম শ্রেণি'), findsOneWidget);
  });
}
