import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/connectivity_provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/database/app_database.dart';

class CacheStatusBanner extends ConsumerWidget {
  final bool visible;
  final String? cacheKey;
  final String? entityType;
  const CacheStatusBanner(
      {super.key, this.visible = true, this.cacheKey, this.entityType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!visible) return const SizedBox.shrink();
    if (!ref.watch(isOnlineProvider)) {
      final content = cacheKey == null || entityType == null
          ? 'অফলাইন মোড: দেখানো তথ্য শেষবার সংরক্ষিত কপি। ইন্টারনেট এলে আপডেট হবে।'
          : 'অফলাইন মোড: দেখানো তথ্য শেষবার সংরক্ষিত কপি। ইন্টারনেট এলে আপডেট হবে।';
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
        child: Row(
          children: [
            Icon(Icons.cloud_off_rounded, size: 18, color: AppColors.warning),
            SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                content,
                style: TextStyle(fontSize: 12, color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
      );
    }
    if (cacheKey != null && entityType != null) {
      return FutureBuilder<CurriculumCacheTableData?>(
        future: (appDatabase.select(appDatabase.curriculumCacheTable)
              ..where((t) => t.cacheKey.equals(cacheKey!))
              ..where((t) => t.entityType.equals(entityType!)))
            .getSingleOrNull(),
        builder: (context, snapshot) {
          final fetchedAt = snapshot.data?.fetchedAt;
          if (fetchedAt == null) return const SizedBox.shrink();
          final age = DateTime.now().toUtc().difference(fetchedAt.toUtc());
          if (age.inMinutes < 5) return const SizedBox.shrink();
          final label = age.inHours > 0
              ? '${age.inHours} ঘণ্টা'
              : '${age.inMinutes} মিনিট';
          return Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: AppSpacing.md),
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md, vertical: AppSpacing.sm),
            decoration: BoxDecoration(
                color: AppColors.warning.withAlpha(24),
                borderRadius: BorderRadius.circular(12)),
            child: Text('ক্যাশ করা তথ্য • $label আগে আপডেট হয়েছে',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textPrimary)),
          );
        },
      );
    }
    return const SizedBox.shrink();
  }
}
