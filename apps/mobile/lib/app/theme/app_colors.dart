import 'package:flutter/material.dart';

/// Minimals.cc Signature Color Palette & Design Tokens
class AppColors {
  // Primary Emerald Accent (Minimals Signature)
  static const Color primary = Color(0xFF00A76F);
  static const Color primaryLight = Color(0xFFD2F9EA);
  static const Color primaryDark = Color(0xFF007867);

  // Secondary & Accents
  static const Color secondary = Color(0xFF8E33FF);
  static const Color secondaryLight = Color(0xFFF2E7FE);
  static const Color info = Color(0xFF00B8D9);
  static const Color infoLight = Color(0xFFCAFDF5);
  static const Color warning = Color(0xFFFFAB00);
  static const Color warningLight = Color(0xFFFFF5CC);
  static const Color error = Color(0xFFFF5630);
  static const Color errorLight = Color(0xFFFFE8D6);

  // Background & Surfaces
  static const Color background = Color(0xFFF4F6F8);
  static const Color surface = Colors.white;
  static const Color surfaceSubtle = Color(0xFFF9FAFB);

  // Typography & Neutral Shades
  static const Color textPrimary = Color(0xFF1C252E);
  static const Color textSecondary = Color(0xFF637381);
  static const Color textDisabled = Color(0xFF919EAB);

  // Borders & Divider Elements
  static const Color border = Color(0x1F919EAB); // Subtle 12% opacity slate border
  static const Color borderStrong = Color(0x33919EAB);

  // Minimals Signature Soft Box Shadow
  static List<BoxShadow> get minimalsShadow => [
        const BoxShadow(
          color: Color(0x0C919EAB),
          blurRadius: 20,
          spreadRadius: 0,
          offset: Offset(0, 8),
        ),
      ];

  static List<BoxShadow> get minimalsShadowHover => [
        const BoxShadow(
          color: Color(0x14919EAB),
          blurRadius: 24,
          spreadRadius: 0,
          offset: Offset(0, 12),
        ),
      ];
}
