import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../practice/domain/entities/practice_question.dart';
import '../../../practice/presentation/controllers/practice_controller.dart';

class PracticeSetupPage extends ConsumerStatefulWidget {
  final String? initialLessonId;

  const PracticeSetupPage({super.key, this.initialLessonId});

  @override
  ConsumerState<PracticeSetupPage> createState() => _PracticeSetupPageState();
}

class _PracticeSetupPageState extends ConsumerState<PracticeSetupPage> {
  int _selectedCount = 10;
  PracticeDifficulty _selectedDifficulty = PracticeDifficulty.medium;
  bool _isLoading = false;

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
          onPressed: () => context.go(AppRoutes.learn),
        ),
        title: Text(
          l10n.practiceTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question Count Chips
                    Text(
                      l10n.questionCountLabel,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [5, 10, 15, 20].map((cnt) {
                        final isSelected = _selectedCount == cnt;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: InkWell(
                              onTap: () => setState(() => _selectedCount = cnt),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary.withAlpha(20)
                                      : AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.border,
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Text(
                                  '$cnt',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.textPrimary,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Difficulty Selector
                    Text(
                      l10n.difficultyLabel,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildDifficultyChip(PracticeDifficulty.easy, 'সহজ'),
                        _buildDifficultyChip(
                            PracticeDifficulty.medium, 'মাঝারি'),
                        _buildDifficultyChip(PracticeDifficulty.hard, 'কঠিন'),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Practice Information Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline_rounded,
                                  color: AppColors.primary, size: 22),
                              SizedBox(width: 8),
                              Text(
                                'অনুশীলন নির্দেশিকা',
                                style: AppTypography.cardTitle,
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'প্রতিটি প্রশ্নের উত্তর দেওয়ার পর সাথে সাথে সঠিক উত্তর এবং বিস্তারিত ব্যাখ্যা দেখতে পাবে। ভুল হলে পরবর্তীতে ভুল পর্যালোচনায় তা পাওয়া যাবে।',
                            style: AppTypography.body,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Start Action
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
                  onPressed: _isLoading
                      ? null
                      : () async {
                          setState(() => _isLoading = true);
                          final lessonId =
                              widget.initialLessonId ?? 'lesson_default';
                          try {
                            await ref
                                .read(practiceControllerProvider.notifier)
                                .startSession(
                                  lessonId: lessonId,
                                  limit: _selectedCount,
                                  difficulty: _selectedDifficulty,
                                );
                            if (context.mounted) {
                              context.go(AppRoutes.practiceSessionMcq);
                            }
                          } finally {
                            if (mounted) {
                              setState(() => _isLoading = false);
                            }
                          }
                        },
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.play_arrow_rounded,
                          color: Colors.white, size: 24),
                  label: Text(
                    _isLoading ? 'শুরু হচ্ছে...' : l10n.startPractice,
                    style: const TextStyle(
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
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDifficultyChip(PracticeDifficulty difficulty, String label,
      {bool isSpecial = false}) {
    final isSelected = _selectedDifficulty == difficulty;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor:
          isSpecial ? AppColors.primary : AppColors.primary.withAlpha(40),
      backgroundColor: AppColors.surface,
      labelStyle: TextStyle(
        color: isSelected
            ? (isSpecial ? Colors.white : AppColors.primary)
            : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (val) {
        if (val) setState(() => _selectedDifficulty = difficulty);
      },
    );
  }
}
