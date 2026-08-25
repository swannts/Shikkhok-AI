import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../domain/entities/study_plan.dart';
import '../../domain/entities/study_plan_item.dart';
import '../controllers/study_plan_controller.dart';

class TodaysStudyPlanPage extends ConsumerStatefulWidget {
  const TodaysStudyPlanPage({super.key});

  @override
  ConsumerState<TodaysStudyPlanPage> createState() =>
      _TodaysStudyPlanPageState();
}

class _TodaysStudyPlanPageState extends ConsumerState<TodaysStudyPlanPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(studyPlanControllerProvider.notifier).loadCurrentPlan();
    });
  }

  Future<void> _refresh() async {
    await ref.read(studyPlanControllerProvider.notifier).refresh();
  }

  Future<void> _generatePlan() async {
    await ref
        .read(studyPlanControllerProvider.notifier)
        .generateRecommendedPlan();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(studyPlanControllerProvider);
    final notifier = ref.read(studyPlanControllerProvider.notifier);
    final plan = state.plan;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.todaysStudyPlan,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: state.isLoading ? null : notifier.refresh,
            icon:
                const Icon(Icons.refresh_rounded, color: AppColors.textPrimary),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: Builder(
            builder: (context) {
              if (state.isLoading) {
                return ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: 6,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => const AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AppSkeleton(width: 180, height: 16),
                        SizedBox(height: 12),
                        AppSkeleton(width: double.infinity, height: 12),
                        SizedBox(height: 8),
                        AppSkeleton(width: double.infinity, height: 12),
                        SizedBox(height: 8),
                        AppSkeleton(width: 120, height: 12),
                      ],
                    ),
                  ),
                );
              }

              if (plan == null) {
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    AppEmptyState(
                      icon: Icons.calendar_today_rounded,
                      title: 'আজকের পরিকল্পনা নেই',
                      description: state.errorMessage ??
                          'আপনার জন্য স্বয়ংক্রিয়ভাবে একটি অধ্যয়ন পরিকল্পনা তৈরি করা যাবে।',
                      actionLabel: state.isGenerating
                          ? 'তৈরি হচ্ছে...'
                          : 'পরিকল্পনা তৈরি করুন',
                      onActionTap: state.isGenerating ? null : _generatePlan,
                    ),
                  ],
                );
              }

              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppSpacing.md),
                children: [
                  _StudyPlanHeroCard(plan: plan),
                  const SizedBox(height: AppSpacing.lg),
                  const Text(
                    'আজকের নির্ধারিত টাস্কসমূহ',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (plan.items.isEmpty)
                    const AppCard(
                      child: Text(
                        'এই পরিকল্পনায় এখনও কোনো টাস্ক যোগ করা হয়নি।',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  else
                    ...plan.items.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      final subjectLabel = item.subjectId ?? 'ফোকাস';
                      return Padding(
                        padding: EdgeInsets.only(
                          bottom: index == plan.items.length - 1 ? 0 : 12,
                        ),
                        child: _PlanTaskTile(
                            item: item, subjectLabel: subjectLabel),
                      );
                    }),
                  const SizedBox(height: AppSpacing.lg),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: state.isGenerating ? null : _generatePlan,
                      icon: state.isGenerating
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.auto_awesome_rounded,
                              color: Colors.white),
                      label: Text(
                        state.isGenerating
                            ? 'নতুন পরিকল্পনা তৈরি হচ্ছে...'
                            : 'নতুন পরিকল্পনা তৈরি করুন',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _StudyPlanHeroCard extends StatelessWidget {
  const _StudyPlanHeroCard({required this.plan});

  final StudyPlan plan;

  String _formatMinutes(int minutes) {
    if (minutes <= 0) {
      return '0 মি';
    }
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    if (hours == 0) {
      return '$minutes মি';
    }
    if (remainingMinutes == 0) {
      return '$hours ঘণ্টা';
    }
    return '$hours ঘণ্টা $remainingMinutes মি';
  }

  @override
  Widget build(BuildContext context) {
    final progress = plan.progressValue;
    final progressLabel = plan.dailyTargetMinutes > 0
        ? '${_formatMinutes(plan.completedMinutes)} / ${_formatMinutes(plan.dailyTargetMinutes)}'
        : '${plan.completedCount} / ${plan.items.length} টাস্ক';

    return AppCard(
      backgroundColor: AppColors.primary,
      border: Border.all(color: AppColors.primary),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            plan.title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          if ((plan.description ?? '').isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              plan.description!,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.white70,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'আজকের লক্ষ্য: ${_formatMinutes(plan.dailyTargetMinutes)}',
                style: const TextStyle(color: Colors.white70),
              ),
              Text(
                progressLabel,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress.isFinite ? progress : 0,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanTaskTile extends StatelessWidget {
  const _PlanTaskTile({
    required this.item,
    required this.subjectLabel,
  });

  final StudyPlanItem item;
  final String subjectLabel;

  @override
  Widget build(BuildContext context) {
    final isCompleted = item.completed == true;
    final color = isCompleted ? Colors.green : AppColors.primary;

    return AppCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isCompleted
                ? Icons.check_circle_rounded
                : Icons.play_circle_fill_rounded,
            color: color,
            size: 28,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                    color: isCompleted
                        ? AppColors.textSecondary
                        : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$subjectLabel • ${item.targetMinutes} মিনিট',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                if ((item.note ?? '').isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.note!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
