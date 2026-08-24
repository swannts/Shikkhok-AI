import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';

class AppOfflineBanner extends StatelessWidget {
  const AppOfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs + 2),
      color: AppColors.warningLight,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 16, color: AppColors.warning),
          const SizedBox(width: AppSpacing.xs),
          Text(
            'অফলাইনে আছেন (সংরক্ষিত কনটেন্ট দেখা যাচ্ছে)',
            style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: AppColors.warning),
          ),
        ],
      ),
    );
  }
}
