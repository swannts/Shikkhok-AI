import 'package:flutter/material.dart';

/// Minimal UI-inspired Design System Colors for Shikkhok-AI
class AppColors {
  static bool _darkPaletteEnabled = false;

  static void setDarkPaletteEnabled(bool enabled) {
    _darkPaletteEnabled = enabled;
  }

  // Base Palette (Core)
  // Minimal-style palette: calm neutrals with a single learning green accent.
  static const Color primary = Color(0xFF00AB55);
  static Color get primaryLight =>
      _darkPaletteEnabled ? const Color(0xFF204532) : const Color(0xFFE9FCD4);
  static const Color primaryContainer = Color(0xFF5BE49B);
  static const Color primaryFixed = Color(0xFFC8F7D9);
  static const Color primaryFixedDim = Color(0xFF8DE8B5);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryFixed = Color(0xFF07006C);

  // Typography & Neutrals
  static Color get background =>
      _darkPaletteEnabled ? const Color(0xFF141A21) : const Color(0xFFF4F6F8);
  static Color get surface =>
      _darkPaletteEnabled ? const Color(0xFF1C252E) : const Color(0xFFFFFFFF);
  static Color get surfaceLow =>
      _darkPaletteEnabled ? const Color(0xFF25313B) : const Color(0xFFF0F3F5);
  static Color get surfaceContainer =>
      _darkPaletteEnabled ? const Color(0xFF303B46) : const Color(0xFFE7EBEE);
  static Color get surfaceHigh =>
      _darkPaletteEnabled ? const Color(0xFF3B4652) : const Color(0xFFDDE3E7);
  static Color get surfaceHighest =>
      _darkPaletteEnabled ? const Color(0xFF46525E) : const Color(0xFFD4DCE1);

  static Color get textPrimary =>
      _darkPaletteEnabled ? const Color(0xFFF4F6F8) : const Color(0xFF212B36);
  static Color get textSecondary =>
      _darkPaletteEnabled ? const Color(0xFFADB8C2) : const Color(0xFF637381);
  static Color get textInverse =>
      _darkPaletteEnabled ? const Color(0xFF212B36) : const Color(0xFFFFFFFF);

  static Color get divider =>
      _darkPaletteEnabled ? const Color(0xFF303B46) : const Color(0xFFE1E6EA);
  static Color get border =>
      _darkPaletteEnabled ? const Color(0xFF36424E) : const Color(0xFFE1E6EA);
  static Color get outline =>
      _darkPaletteEnabled ? const Color(0xFF8793A0) : const Color(0xFF919EAB);
  static Color get outlineVariant =>
      _darkPaletteEnabled ? const Color(0xFF637381) : const Color(0xFFC4CDD4);

  // Status & Semantic Colors
  static const Color success = Color(0xFF00AB55);
  static Color get successLight =>
      _darkPaletteEnabled ? const Color(0xFF173B2B) : const Color(0xFFE9FCD4);
  static const Color warning = Color(0xFFF4A62A);
  static Color get warningLight =>
      _darkPaletteEnabled ? const Color(0xFF3C321B) : const Color(0xFFFEF3C7);
  static const Color error = Color(0xFFD94040);
  static Color get errorLight =>
      _darkPaletteEnabled ? const Color(0xFF42282A) : const Color(0xFFFFDAD6);
  static const Color info = Color(0xFF3B82F6);

  // Secondary Accents
  static const Color secondaryBlue = Color(0xFF1877F2);
  static Color get secondaryContainer =>
      _darkPaletteEnabled ? const Color(0xFF1D344D) : const Color(0xFFD6E8FF);
  static const Color tertiaryMagenta = Color(0xFFB10076);
  static const Color tertiaryContainer = Color(0xFFD32B90);

  // Elevation & Shadows
  static const List<BoxShadow> minimalsShadow = [
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  // Map old variables to new ones for backward compatibility
  static Color get surfaceMuted => surfaceLow;
  static Color get surfaceHover => surfaceContainer;
  static Color get textDisabled => outlineVariant;
  static const Color secondary = secondaryBlue;
  static Color get secondaryLight => secondaryContainer;
  static Color get infoLight => surfaceHighest;
  static const Color primaryDark = Color(0xFF3730A3); // added for compatibility
}
