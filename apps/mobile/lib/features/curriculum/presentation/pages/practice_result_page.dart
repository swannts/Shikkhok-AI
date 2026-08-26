import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../practice/presentation/controllers/practice_controller.dart';

class PracticeResultPage extends ConsumerWidget {
  const PracticeResultPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final practiceState = ref.watch(practiceControllerProvider);

    final completedSession =
        practiceState is PracticeSessionCompleted ? practiceState : null;

    final correctCount = completedSession?.correctCount ?? 0;
    final totalCount = completedSession?.totalQuestions ?? 0;
    final accuracy = completedSession?.scorePercentage.round() ?? 0;
    final timeSpentSec = completedSession?.totalTimeSpentSeconds ?? 0;
    final timeSpentMin = (timeSpentSec / 60).ceil();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.home),
        ),
        title: Text(
          l10n.resultTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Trophy / Celebration Icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(20),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.emoji_events_rounded,
                  color: AppColors.primary,
                  size: 48,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                l10n.greatEffortTitle,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Score Metrics Summary Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildMetricCol(
                      l10n.scoreLabel,
                      '$correctCount / $totalCount',
                      AppColors.primary,
                    ),
                    const VerticalDivider(width: 1, color: AppColors.border),
                    _buildMetricCol(
                      l10n.accuracyLabel,
                      '$accuracy%',
                      Colors.green,
                    ),
                    const VerticalDivider(width: 1, color: AppColors.border),
                    _buildMetricCol(
                      l10n.timeSpent,
                      '$timeSpentMin মিনিট',
                      AppColors.textPrimary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),

              // Action Buttons
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () => context.go(AppRoutes.practiceMistakeReview),
                  icon: const Icon(Icons.rate_review_outlined,
                      color: Colors.white),
                  label: const Text(
                    'ভুল পর্যালোচনা করুন',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () => context.go(AppRoutes.learn),
                  icon:
                      const Icon(Icons.home_outlined, color: AppColors.primary),
                  label: const Text(
                    'শিক্ষা বিভাগে ফিরে যান',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCol(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
