import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';

enum AppBadgeVariant { primary, success, warning, error, info, neutral }

class AppBadge extends StatelessWidget {
  final String label;
  final Widget? icon;
  final AppBadgeVariant variant;
  final VoidCallback? onTap;

  const AppBadge({
    super.key,
    required this.label,
    this.icon,
    this.variant = AppBadgeVariant.primary,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color bgColor = variant == AppBadgeVariant.primary
        ? AppColors.primaryLight
        : variant == AppBadgeVariant.success
            ? AppColors.successLight
            : variant == AppBadgeVariant.warning
                ? AppColors.warningLight
                : variant == AppBadgeVariant.error
                    ? AppColors.errorLight
                    : variant == AppBadgeVariant.info
                        ? AppColors.infoLight
                        : AppColors.surfaceMuted;

    final Color fgColor = variant == AppBadgeVariant.primary
        ? AppColors.primaryDark
        : variant == AppBadgeVariant.success
            ? AppColors.success
            : variant == AppBadgeVariant.warning
                ? AppColors.warning
                : variant == AppBadgeVariant.error
                    ? AppColors.error
                    : variant == AppBadgeVariant.info
                        ? AppColors.info
                        : AppColors.textSecondary;

    final widget = Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm + 2, vertical: AppSpacing.xs + 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: AppRadius.borderMd,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            icon!,
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.bold,
              color: fgColor,
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: widget);
    }
    return widget;
  }
}
