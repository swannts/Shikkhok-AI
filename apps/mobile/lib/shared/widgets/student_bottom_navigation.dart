import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/app_routes.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';

class StudentBottomNavigation extends StatelessWidget {
  const StudentBottomNavigation({super.key});

  static const destinations = <NavigationDestination>[
    NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home_rounded),
        label: 'হোম'),
    NavigationDestination(
        icon: Icon(Icons.menu_book_outlined),
        selectedIcon: Icon(Icons.menu_book_rounded),
        label: 'শিক্ষা'),
    NavigationDestination(
        icon: Icon(Icons.smart_toy_outlined),
        selectedIcon: Icon(Icons.smart_toy_rounded),
        label: 'টিউটর'),
    NavigationDestination(
        icon: Icon(Icons.quiz_outlined),
        selectedIcon: Icon(Icons.quiz_rounded),
        label: 'অনুশীলন'),
    NavigationDestination(
        icon: Icon(Icons.person_outline),
        selectedIcon: Icon(Icons.person_rounded),
        label: 'প্রোফাইল'),
  ];

  String _currentPath(BuildContext context) {
    try {
      return GoRouterState.of(context).uri.path;
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final path = _currentPath(context);
    return NavigationBar(
      selectedIndex: _selectedIndex(path),
      onDestinationSelected: (index) => _go(context, index),
      destinations: destinations,
      labelTextStyle: const WidgetStatePropertyAll(AppTypography.captionBold),
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.primaryLight,
    );
  }

  int _selectedIndex(String path) {
    if (path == AppRoutes.learn || path.startsWith('/subjects/')) return 1;
    if (path == AppRoutes.aiTutorChat || path.startsWith('/tutor/')) return 2;
    if (path.startsWith('/practice')) return 3;
    if (path == AppRoutes.studentProfile || path == AppRoutes.settings) {
      return 4;
    }
    return 0;
  }

  void _go(BuildContext context, int index) {
    final route = [
      AppRoutes.home,
      AppRoutes.learn,
      AppRoutes.aiTutorChat,
      AppRoutes.practiceSetup,
      AppRoutes.studentProfile,
    ][index];
    if (_currentPath(context) != route) {
      context.go(route);
    }
  }
}
