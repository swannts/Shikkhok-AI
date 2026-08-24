import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/theme/app_theme.dart';
import 'package:mobile/shared/widgets/app_badge.dart';
import 'package:mobile/shared/widgets/app_button.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/app_search_field.dart';
import 'package:mobile/shared/widgets/app_text_field.dart';

void main() {
  group('Shared Widgets Unit & Render Tests', () {
    testWidgets('AppButton renders label and handles tap correctly',
        (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: AppButton(
              label: 'শুরু করুন',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('শুরু করুন'), findsOneWidget);
      await tester.tap(find.byType(AppButton));
      expect(tapped, isTrue);
    });

    testWidgets('AppCard renders child and padding correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: AppCard(
              child: Text('টেস্ট কার্ড'),
            ),
          ),
        ),
      );

      expect(find.text('টেস্ট কার্ড'), findsOneWidget);
      expect(find.byType(AppCard), findsOneWidget);
    });

    testWidgets('AppBadge renders variant badge correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: AppBadge(
              label: 'সফল',
              variant: AppBadgeVariant.success,
            ),
          ),
        ),
      );

      expect(find.text('সফল'), findsOneWidget);
    });

    testWidgets('AppTextField handles text input correctly',
        (WidgetTester tester) async {
      final controller = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: AppTextField(
              controller: controller,
              hintText: 'ইমেইল লিখুন',
            ),
          ),
        ),
      );

      expect(find.byType(AppTextField), findsOneWidget);
      await tester.enterText(find.byType(TextField), 'user@test.com');
      expect(controller.text, 'user@test.com');
    });

    testWidgets('AppSearchField clear button clears query text',
        (WidgetTester tester) async {
      final controller = TextEditingController(text: 'বীজগণিত');

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: AppSearchField(
              controller: controller,
              hintText: 'খুঁজুন',
            ),
          ),
        ),
      );

      expect(find.text('বীজগণিত'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded));
      await tester.pump();
      expect(controller.text, isEmpty);
    });
  });
}
