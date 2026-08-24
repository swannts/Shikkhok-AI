import 'package:flutter/material.dart';

/// Reusable Layered Subtle Shadows Presets
class AppShadows {
  static List<BoxShadow> get soft => const [
        BoxShadow(
          color: Color(0x08919EAB),
          blurRadius: 12,
          spreadRadius: 0,
          offset: Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get card => const [
        BoxShadow(
          color: Color(0x0C919EAB),
          blurRadius: 20,
          spreadRadius: 0,
          offset: Offset(0, 8),
        ),
      ];

  static List<BoxShadow> get dropdown => const [
        BoxShadow(
          color: Color(0x14919EAB),
          blurRadius: 24,
          spreadRadius: 0,
          offset: Offset(0, 12),
        ),
      ];

  static List<BoxShadow> get modal => const [
        BoxShadow(
          color: Color(0x1F1C252E),
          blurRadius: 32,
          spreadRadius: 0,
          offset: Offset(0, 16),
        ),
      ];
}
