import 'package:flutter/material.dart';

/// Minimal UI-inspired Design System Colors for Shikkhok-AI
class AppColors {
  // Base Palette (Core)
  // Minimal-style palette: calm neutrals with a single learning green accent.
  static const Color primary = Color(0xFF00AB55);
  static const Color primaryLight = Color(0xFFE9FCD4);
  static const Color primaryContainer = Color(0xFF5BE49B);
  static const Color primaryFixed = Color(0xFFC8F7D9);
  static const Color primaryFixedDim = Color(0xFF8DE8B5);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryFixed = Color(0xFF07006C);

  // Typography & Neutrals
  static const Color background = Color(0xFFF4F6F8);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceLow = Color(0xFFF0F3F5);
  static const Color surfaceContainer = Color(0xFFE7EBEE);
  static const Color surfaceHigh = Color(0xFFDDE3E7);
  static const Color surfaceHighest = Color(0xFFD4DCE1);

  static const Color textPrimary = Color(0xFF212B36);
  static const Color textSecondary = Color(0xFF637381);
  static const Color textInverse = Color(0xFFFFFFFF);

  static const Color divider = Color(0xFFE1E6EA);
  static const Color border = Color(0xFFE1E6EA);
  static const Color outline = Color(0xFF919EAB);
  static const Color outlineVariant = Color(0xFFC4CDD4);

  // Status & Semantic Colors
  static const Color success = Color(0xFF00AB55);
  static const Color successLight = Color(0xFFE9FCD4);
  static const Color warning = Color(0xFFF4A62A);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFD94040);
  static const Color errorLight = Color(0xFFFFDAD6);
  static const Color info = Color(0xFF3B82F6);

  // Secondary Accents
  static const Color secondaryBlue = Color(0xFF1877F2);
  static const Color secondaryContainer = Color(0xFFD6E8FF);
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
  static const Color surfaceMuted = surfaceLow;
  static const Color surfaceHover = surfaceContainer;
  static const Color textDisabled = outlineVariant;
  static const Color secondary = secondaryBlue;
  static const Color secondaryLight = secondaryContainer;
  static const Color infoLight = surfaceHighest;
  static const Color primaryDark = Color(0xFF3730A3); // added for compatibility
}
