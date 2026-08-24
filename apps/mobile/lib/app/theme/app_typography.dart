import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Typography Hierarchy & Safe Line-Height Tokens for Bangla/English
class AppTypography {
  static const List<String> fontFallbacks = [
    'SutonnyMJ',
    'Noto Sans Bengali',
    'Anek Bangla',
    'Hind Siliguri',
    'sans-serif',
  ];

  static const TextStyle display = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    height: 1.3,
    color: AppColors.textPrimary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle pageTitle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    height: 1.35,
    color: AppColors.textPrimary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle sectionTitle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.textPrimary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle cardTitle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.45,
    color: AppColors.textPrimary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.6, // Generous line height for safe Bangla rendering
    color: AppColors.textPrimary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.55,
    color: AppColors.textPrimary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    height: 1.4,
    color: AppColors.textSecondary,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );

  static const TextStyle button = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.2,
    color: Colors.white,
    fontFamily: 'SutonnyMJ',
    fontFamilyFallback: fontFallbacks,
  );
}
