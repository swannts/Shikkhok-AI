import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_colors.dart';

final themeModeProvider =
    StateNotifierProvider<ThemeModeController, ThemeMode>((ref) {
  return ThemeModeController();
});

class ThemeModeController extends StateNotifier<ThemeMode> {
  static const _preferenceKey = 'darkMode';
  bool _userChangedMode = false;

  ThemeModeController() : super(ThemeMode.light) {
    AppColors.setDarkPaletteEnabled(false);
    _restorePreference();
  }

  Future<void> _restorePreference() async {
    final preferences = await SharedPreferences.getInstance();
    if (_userChangedMode || !mounted) return;
    final isDark = preferences.getBool(_preferenceKey) ?? false;
    AppColors.setDarkPaletteEnabled(isDark);
    state = isDark ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> setDarkMode(bool enabled) async {
    _userChangedMode = true;
    AppColors.setDarkPaletteEnabled(enabled);
    state = enabled ? ThemeMode.dark : ThemeMode.light;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_preferenceKey, enabled);
  }
}
