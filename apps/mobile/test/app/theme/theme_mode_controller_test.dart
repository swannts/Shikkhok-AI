import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/theme/app_colors.dart';
import 'package:mobile/app/theme/theme_mode_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppColors.setDarkPaletteEnabled(false);
  });

  test('restores the saved dark mode and applies the dark palette', () async {
    SharedPreferences.setMockInitialValues({'darkMode': true});
    final controller = ThemeModeController();

    await Future<void>.delayed(const Duration(milliseconds: 10));

    expect(controller.state, ThemeMode.dark);
    expect(AppColors.background, const Color(0xFF141A21));
    controller.dispose();
  });

  test('persists and applies a dark mode change', () async {
    final controller = ThemeModeController();
    await controller.setDarkMode(true);

    final preferences = await SharedPreferences.getInstance();
    expect(preferences.getBool('darkMode'), isTrue);
    expect(controller.state, ThemeMode.dark);
    expect(AppColors.textPrimary, const Color(0xFFF4F6F8));
    controller.dispose();
  });
}
