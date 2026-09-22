import 'package:flutter/material.dart';

/// Minimal UI-inspired Design System Colors for Shikkhok-AI
class AppColors {
  // Base Palette (Core)
  static const Color primary = Color(0xFF5B4FE9);
  static const Color primaryLight = Color(0xFFEEECFF);
  static const Color primaryContainer = Color(0xFF6063EE);
  static const Color primaryFixed = Color(0xFFE1E0FF);
  static const Color primaryFixedDim = Color(0xFFC0C1FF);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryFixed = Color(0xFF07006C);

  // Typography & Neutrals
  static const Color background = Color(0xFFF8F9FC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceLow = Color(0xFFEFF4FF);
  static const Color surfaceContainer = Color(0xFFE5EEFF);
  static const Color surfaceHigh = Color(0xFFDCE9FF);
  static const Color surfaceHighest = Color(0xFFD3E4FE);

  static const Color textPrimary = Color(0xFF17171B);
  static const Color textSecondary = Color(0xFF6B6B76);
  static const Color textInverse = Color(0xFFFFFFFF);

  static const Color divider = Color(0xFFE8E8EF);
  static const Color border = Color(0xFFE8E8EF);
  static const Color outline = Color(0xFF767586);
  static const Color outlineVariant = Color(0xFFC7C4D7);

  // Status & Semantic Colors
  static const Color success = Color(0xFF25A65A);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFF4A62A);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFD94040);
  static const Color errorLight = Color(0xFFFFDAD6);
  static const Color info = Color(0xFF3B82F6);

  // Secondary Accents
  static const Color secondaryBlue = Color(0xFF4659A7);
  static const Color secondaryContainer = Color(0xFF97A9FD);
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
