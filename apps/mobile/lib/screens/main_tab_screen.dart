import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'tutor_screen.dart';
import '../core/theme/theme.dart';

class MainTabScreen extends StatefulWidget {
  const MainTabScreen({super.key});

  @override
  State<MainTabScreen> createState() => _MainTabScreenState();
}

class _MainTabScreenState extends State<MainTabScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const Scaffold(body: Center(child: Text('পাঠ্যক্রম (Curriculum)'))),
    const TutorScreen(),
    const Scaffold(body: Center(child: Text('অগ্রগতি (Progress analytics)'))),
    const Scaffold(body: Center(child: Text('প্রোফাইল (Profile)'))),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textSecondary,
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
  }
}
