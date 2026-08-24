import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class TodaysStudyPlanPage extends StatelessWidget {
  const TodaysStudyPlanPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.todaysStudyPlan,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Goal Summary Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withAlpha(50),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('আজকের লক্ষ্য: ৪৫ মিনিট',
                              style: TextStyle(
                                  fontSize: 14, color: Colors.white70)),
                          const SizedBox(height: 4),
                          const Text('৩০ মিনিট সম্পন্ন (৬৬%)',
                              style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white)),
                          const SizedBox(height: AppSpacing.md),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: const LinearProgressIndicator(
                              value: 0.66,
                              backgroundColor: Colors.white24,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                              minHeight: 8,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const Text(
                      'আজকের নির্ধারিত টাস্কসমূহ',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    _buildPlanTaskTile(
                      title: 'সরল সমীকরণ (পাঠ ৪)',
                      subtitle: 'গণিত • ১৫ মিনিট',
                      statusIcon: Icons.check_circle_rounded,
                      statusColor: Colors.green,
                      isCompleted: true,
                      onTap: () => context.go('/lesson-reader'),
                    ),
                    const SizedBox(height: 12),
                    _buildPlanTaskTile(
                      title: 'বীজগণিতীয় সূত্রাবলি',
                      subtitle: 'গণিত • ২০ মিনিট',
                      statusIcon: Icons.play_circle_fill_rounded,
                      statusColor: AppColors.primary,
                      isInProgress: true,
                      onTap: () => context.go('/lesson-reader'),
                    ),
                    const SizedBox(height: 12),
                    _buildPlanTaskTile(
                      title: 'বিজ্ঞান মডেল টেস্ট ১',
                      subtitle: 'বিজ্ঞান • ১০ মিনিট',
                      statusIcon: Icons.lock_rounded,
                      statusColor: AppColors.textSecondary,
                      isLocked: true,
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Action
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () => context.go('/lesson-reader'),
                  icon: const Icon(Icons.play_arrow_rounded,
                      color: Colors.white, size: 24),
                  label: const Text(
                    'পড়াশোনা শুরু করুন',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanTaskTile({
    required String title,
    required String subtitle,
    required IconData statusIcon,
    required Color statusColor,
    bool isCompleted = false,
    bool isInProgress = false,
    bool isLocked = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: isLocked ? null : onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isLocked ? AppColors.background : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isInProgress ? AppColors.primary : AppColors.border,
            width: isInProgress ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(statusIcon, color: statusColor, size: 28),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      decoration:
                          isCompleted ? TextDecoration.lineThrough : null,
                      color: isLocked
                          ? AppColors.textSecondary
                          : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
