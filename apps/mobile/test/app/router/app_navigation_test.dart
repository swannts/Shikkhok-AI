import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/app/router/app_routes.dart';

void main() {
  group('AppRoutes.back', () {
    testWidgets('pops to the actual previous page when available',
        (tester) async {
      final router = GoRouter(
        initialLocation: '/home',
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => Scaffold(
              body: TextButton(
                onPressed: () => context.push('/detail'),
                child: const Text('Open detail'),
              ),
            ),
          ),
          GoRoute(
            path: '/detail',
            builder: (context, state) => Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => AppRoutes.back(
                    context,
                    fallbackLocation: '/fallback',
                  ),
                  child: const Text('Back'),
                ),
              ),
            ),
          ),
          GoRoute(
            path: '/fallback',
            builder: (context, state) => const Scaffold(
              body: Text('Fallback'),
            ),
          ),
        ],
      );
      addTearDown(router.dispose);

      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('Open detail'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();

      expect(find.text('Open detail'), findsOneWidget);
      expect(find.text('Fallback'), findsNothing);
    });

    testWidgets('uses the supplied fallback for a directly opened page',
        (tester) async {
      final router = GoRouter(
        initialLocation: '/detail',
        routes: [
          GoRoute(
            path: '/detail',
            builder: (context, state) => Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => AppRoutes.back(
                    context,
                    fallbackLocation: '/fallback',
                  ),
                  child: const Text('Back'),
                ),
              ),
            ),
          ),
          GoRoute(
            path: '/fallback',
            builder: (context, state) => const Scaffold(
              body: Text('Fallback'),
            ),
          ),
        ],
      );
      addTearDown(router.dispose);

      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();

      expect(find.text('Fallback'), findsOneWidget);
    });
  });
}
