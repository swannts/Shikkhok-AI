import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../profile/presentation/controllers/student_profile_controller.dart';

class GoalSettingPage extends ConsumerStatefulWidget {
  const GoalSettingPage({super.key});

  @override
  ConsumerState<GoalSettingPage> createState() => _GoalSettingPageState();
}

class _GoalSettingPageState extends ConsumerState<GoalSettingPage> {
  final Set<int> _selectedGoals = {0, 1, 4}; // Default selected goals
  int _selectedMinutes = 30; // Default 30 minutes
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final goals = [
      (Icons.menu_book_rounded, l10n.goalSchool),
      (Icons.description_outlined, l10n.goalExam),
      (Icons.trending_up_rounded, l10n.goalWeakness),
      (Icons.edit_calendar_rounded, l10n.goalPractice),
      (Icons.smart_toy_outlined, l10n.goalAiTutor),
    ];

    final times = [15, 30, 45, 60];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/curriculum-selection'),
        ),
        title: const Text(
          'Shikkhok-AI',
          style: TextStyle(
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
                    // Step Progress 100%
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(l10n.stepProgress('৩'),
                            style: const TextStyle(
                                fontSize: 14, color: AppColors.textSecondary)),
                        const Text('100%',
                            style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: const LinearProgressIndicator(
                        value: 1.0,
                        backgroundColor: AppColors.border,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.primary),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Headings
                    Text(
                      l10n.selectGoalTitle,
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      l10n.selectGoalSubtitle,
                      style: const TextStyle(
                          fontSize: 15, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Goals Multi-Select List
                    ...List.generate(goals.length, (index) {
                      final item = goals[index];
                      final isSelected = _selectedGoals.contains(index);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              if (isSelected) {
                                if (_selectedGoals.length > 1) {
                                  _selectedGoals.remove(index);
                                }
                              } else {
                                _selectedGoals.add(index);
                              }
                            });
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.md, vertical: 14),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary.withAlpha(20)
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(item.$1,
                                    size: 24,
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.textSecondary),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Text(
                                    item.$2,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                      color: isSelected
                                          ? AppColors.primary
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                Icon(
                                  isSelected
                                      ? Icons.check_circle_rounded
                                      : Icons.radio_button_unchecked_rounded,
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.border,
                                  size: 22,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),

                    const SizedBox(height: AppSpacing.xl),

                    // Daily Study Time Goal Selection
                    const Text(
                      'প্রতিদিনের পড়ার সময়সীমা',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    const Text(
                      'তুমি প্রতিদিন কতক্ষণ পড়াশোনা করতে চাও?',
                      style: TextStyle(
                          fontSize: 14, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    Row(
                      children: times.map((mins) {
                        final isSelected = _selectedMinutes == mins;

                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: InkWell(
                              onTap: () =>
                                  setState(() => _selectedMinutes = mins),
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                height: 68,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.surface,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.border,
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '$mins',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected
                                            ? Colors.white
                                            : AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      l10n.minutesUnit,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isSelected
                                            ? Colors.white70
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky CTA
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSaving
                      ? null
                      : () async {
                          setState(() => _isSaving = true);
                          final goalLabels = _selectedGoals
                              .map((idx) => goals[idx].$2)
                              .toList();
                          ref
                              .read(studentProfileControllerProvider.notifier)
                              .setDraftGoalsAndSubjects(
                                goals: goalLabels,
                                subjects: const [
                                  'math',
                                  'science',
                                  'english'
                                ],
                              );
                          await ref
                              .read(studentProfileControllerProvider.notifier)
                              .saveCompleteProfile();
                          if (!context.mounted) return;
                          context.go('/home');
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              l10n.startLearningGoal,
                              style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.arrow_forward_rounded,
                                size: 20, color: Colors.white),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
