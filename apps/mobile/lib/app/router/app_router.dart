import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/auth/presentation/state/auth_state.dart';
import '../theme/app_colors.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuth = authState is Authenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/signup') ||
          state.matchedLocation.startsWith('/verify-otp');

      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Login Page Canvas')),
        ),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Signup Page Canvas')),
        ),
      ),
      GoRoute(
        path: '/verify-otp',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Verify OTP Canvas')),
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return Scaffold(
            body: navigationShell,
            bottomNavigationBar: BottomNavigationBar(
              currentIndex: navigationShell.currentIndex,
              onTap: (index) => navigationShell.goBranch(index),
              selectedItemColor: AppColors.primary,
              unselectedItemColor: AppColors.textSecondary,
              type: BottomNavigationBarType.fixed,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.home), label: 'হোম'),
                BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: 'পাঠ্যক্রম'),
                BottomNavigationBarItem(icon: Icon(Icons.smart_toy), label: 'শিক্ষক AI'),
                BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'অগ্রগতি'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: 'প্রোফাইল'),
              ],
            ),
          );
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Home Page Canvas')),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/curriculum',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Curriculum Canvas')),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/tutor',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('AI Tutor Canvas')),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/progress',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Progress Canvas')),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Profile Canvas')),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
