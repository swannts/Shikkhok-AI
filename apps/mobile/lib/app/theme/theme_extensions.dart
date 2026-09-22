import 'package:flutter/material.dart';
import 'app_colors.dart';

class ShikkhokThemeExtension extends ThemeExtension<ShikkhokThemeExtension> {
  final Color surfaceMuted;
  final Color surfaceHover;
  final Color success;
  final Color successLight;
  final Color warning;
  final Color warningLight;
  final Color errorLight;
  final Color infoLight;

  const ShikkhokThemeExtension({
    required this.surfaceMuted,
    required this.surfaceHover,
    required this.success,
    required this.successLight,
    required this.warning,
    required this.warningLight,
    required this.errorLight,
    required this.infoLight,
  });

  static const light = ShikkhokThemeExtension(
    surfaceMuted: AppColors.surfaceLow,
    surfaceHover: AppColors.surfaceContainer,
    success: AppColors.success,
    successLight: AppColors.successLight,
    warning: AppColors.warning,
    warningLight: AppColors.warningLight,
    errorLight: AppColors.errorLight,
    infoLight: AppColors.info, // or another appropriate color from the palette
  );

  @override
  ThemeExtension<ShikkhokThemeExtension> copyWith({
    Color? surfaceMuted,
    Color? surfaceHover,
    Color? success,
    Color? successLight,
    Color? warning,
    Color? warningLight,
    Color? errorLight,
    Color? infoLight,
  }) {
    return ShikkhokThemeExtension(
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      surfaceHover: surfaceHover ?? this.surfaceHover,
      success: success ?? this.success,
      successLight: successLight ?? this.successLight,
      warning: warning ?? this.warning,
      warningLight: warningLight ?? this.warningLight,
      errorLight: errorLight ?? this.errorLight,
      infoLight: infoLight ?? this.infoLight,
    );
  }

  @override
  ThemeExtension<ShikkhokThemeExtension> lerp(
      covariant ThemeExtension<ShikkhokThemeExtension>? other, double t) {
    if (other is! ShikkhokThemeExtension) {
      return this;
    }
    return ShikkhokThemeExtension(
      surfaceMuted: Color.lerp(surfaceMuted, other.surfaceMuted, t)!,
      surfaceHover: Color.lerp(surfaceHover, other.surfaceHover, t)!,
      success: Color.lerp(success, other.success, t)!,
      successLight: Color.lerp(successLight, other.successLight, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningLight: Color.lerp(warningLight, other.warningLight, t)!,
      errorLight: Color.lerp(errorLight, other.errorLight, t)!,
      infoLight: Color.lerp(infoLight, other.infoLight, t)!,
    );
  }
}
