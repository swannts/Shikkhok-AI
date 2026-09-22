import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Typography Hierarchy & Safe Line-Height Tokens for Bangla/English
class AppTypography {
  static const List<String> fontFallbacks = [
    'Noto Sans Bengali',
    'Inter',
    'Noto Sans',
    'sans-serif',
  ];

  static const TextStyle display = TextStyle(
    fontSize: 34,
    fontWeight: FontWeight.w700,
    height: 42 / 34,
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle pageTitle = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 38 / 28,
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle sectionTitle = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    height: 30 / 20,
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle cardTitle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700, // 650 to 700 weight
    height: 27 / 18,
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle body = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 24 / 16,
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.45, // Generous line height for safe Bangla rendering
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    height: 18 / 12,
    color: AppColors.textSecondary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle captionBold = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.bold,
    height: 18 / 12,
    color: AppColors.textPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w700, // 650 to 700 weight
    color: AppColors.onPrimary,
    fontFamily: 'Noto Sans Bengali',
    fontFamilyFallback: fontFallbacks,
  );
}
