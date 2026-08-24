import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_shadows.dart';

/// Custom ShikkhokThemeExtension for extra design system tokens
@immutable
class ShikkhokThemeExtension extends ThemeExtension<ShikkhokThemeExtension> {
  final List<BoxShadow> softShadow;
  final List<BoxShadow> cardShadow;
  final Color surfaceMuted;
  final Color surfaceHover;

  const ShikkhokThemeExtension({
    required this.softShadow,
    required this.cardShadow,
    required this.surfaceMuted,
    required this.surfaceHover,
  });

  @override
  ShikkhokThemeExtension copyWith({
    List<BoxShadow>? softShadow,
    List<BoxShadow>? cardShadow,
    Color? surfaceMuted,
    Color? surfaceHover,
  }) {
    return ShikkhokThemeExtension(
      softShadow: softShadow ?? this.softShadow,
      cardShadow: cardShadow ?? this.cardShadow,
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      surfaceHover: surfaceHover ?? this.surfaceHover,
    );
  }

  @override
  ShikkhokThemeExtension lerp(
      ThemeExtension<ShikkhokThemeExtension>? other, double t) {
    if (other is! ShikkhokThemeExtension) return this;
    return ShikkhokThemeExtension(
      softShadow: t < 0.5 ? softShadow : other.softShadow,
      cardShadow: t < 0.5 ? cardShadow : other.cardShadow,
      surfaceMuted: Color.lerp(surfaceMuted, other.surfaceMuted, t)!,
      surfaceHover: Color.lerp(surfaceHover, other.surfaceHover, t)!,
    );
  }

  static ShikkhokThemeExtension get light => ShikkhokThemeExtension(
        softShadow: AppShadows.soft,
        cardShadow: AppShadows.card,
        surfaceMuted: AppColors.surfaceMuted,
        surfaceHover: AppColors.surfaceHover,
      );
}
