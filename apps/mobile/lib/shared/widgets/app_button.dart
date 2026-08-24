import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';

enum AppButtonVariant { primary, secondary, outlined, text, danger }

enum AppButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? iconLeft;
  final IconData? iconRight;
  final bool isLoading;
  final bool isDisabled;
  final bool fullWidth;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.iconLeft,
    this.iconRight,
    this.isLoading = false,
    this.isDisabled = false,
    this.fullWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    final double height = size == AppButtonSize.small
        ? 36.0
        : size == AppButtonSize.large
            ? 52.0
            : 48.0;

    final Color bgColor = variant == AppButtonVariant.primary
        ? AppColors.primary
        : variant == AppButtonVariant.secondary
            ? AppColors.primaryLight
            : variant == AppButtonVariant.danger
                ? AppColors.error
                : Colors.transparent;

    final Color fgColor = variant == AppButtonVariant.primary
        ? Colors.white
        : variant == AppButtonVariant.secondary
            ? AppColors.primaryDark
            : variant == AppButtonVariant.danger
                ? Colors.white
                : AppColors.primary;

    Widget child = Row(
      mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fgColor),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
        ] else if (iconLeft != null) ...[
          Icon(iconLeft, size: 18, color: fgColor),
          const SizedBox(width: AppSpacing.sm),
        ],
        Text(
          label,
          style: AppTypography.button.copyWith(color: fgColor),
        ),
        if (iconRight != null && !isLoading) ...[
          const SizedBox(width: AppSpacing.sm),
          Icon(iconRight, size: 18, color: fgColor),
        ],
      ],
    );

    if (variant == AppButtonVariant.outlined) {
      return SizedBox(
        height: height,
        width: fullWidth ? double.infinity : null,
        child: OutlinedButton(
          onPressed: (isDisabled || isLoading) ? null : onPressed,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppColors.border, width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.borderMd),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          ),
          child: child,
        ),
      );
    }

    if (variant == AppButtonVariant.text) {
      return SizedBox(
        height: height,
        width: fullWidth ? double.infinity : null,
        child: TextButton(
          onPressed: (isDisabled || isLoading) ? null : onPressed,
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          ),
          child: child,
        ),
      );
    }

    return SizedBox(
      height: height,
      width: fullWidth ? double.infinity : null,
      child: ElevatedButton(
        onPressed: (isDisabled || isLoading) ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          disabledBackgroundColor: AppColors.surfaceMuted,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: AppRadius.borderMd),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        ),
        child: child,
      ),
    );
  }
}
