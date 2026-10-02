import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/connectivity_provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class CacheStatusBanner extends ConsumerWidget {
  final bool visible;
  const CacheStatusBanner({super.key, this.visible = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!visible) return const SizedBox.shrink();
    if (!ref.watch(isOnlineProvider)) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.warning.withAlpha(24),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.warning.withAlpha(80)),
        ),
        child: const Row(
          children: [
            Icon(Icons.cloud_off_rounded, size: 18, color: AppColors.warning),
            SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                'অফলাইন মোড: দেখানো তথ্য শেষবার সংরক্ষিত কপি। ইন্টারনেট এলে আপডেট হবে।',
                style: TextStyle(fontSize: 12, color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }
}
