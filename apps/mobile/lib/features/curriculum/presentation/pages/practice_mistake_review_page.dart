import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../practice/presentation/controllers/practice_controller.dart';

class PracticeMistakeReviewPage extends ConsumerWidget {
  const PracticeMistakeReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final practiceState = ref.watch(practiceControllerProvider);

    final completedSession =
        practiceState is PracticeSessionCompleted ? practiceState : null;

    final mistakes = <(
      int index,
      String prompt,
      String? selected,
      String? correct,
      String? explanation
    )>[];

    if (completedSession != null) {
      for (int i = 0; i < completedSession.questions.length; i++) {
        final res = completedSession.results[i];
        if (res != null && !res.isCorrect) {
          final q = completedSession.questions[i];
          mistakes.add((
            i + 1,
            q.prompt,
            'ভুল উত্তর',
            res.correctAnswer?.toString() ?? 'সঠিক উত্তর',
            res.explanation ?? res.feedback,
          ));
        }
      }
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.practiceResult),
        ),
        title: Text(
          l10n.mistakeReviewTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
      body: SafeArea(
        child: mistakes.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.sentiment_very_satisfied_rounded,
                        color: Colors.green,
                        size: 64,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      const Text(
                        'অভিনন্দন! কোনো ভুল নেই',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      const Text(
                        'তুমি সবগুলো প্রশ্নের সঠিক উত্তর দিয়েছো।',
                        style: AppTypography.body,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ElevatedButton(
                        onPressed: () => context.go(AppRoutes.learn),
                        child: const Text('শিক্ষা বিভাগে ফিরে যান'),
                      ),
                    ],
                  ),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: mistakes.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppSpacing.md),
                itemBuilder: (context, index) {
                  final m = mistakes[index];
                  return Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.red.shade100,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'প্রশ্ন ${m.$1}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          m.$2,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        // Answers Comparison Box
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.cancel_rounded,
                                      color: Colors.red, size: 18),
                                  const SizedBox(width: 8),
                                  const Text('তোমার উত্তর: ',
                                      style: TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textSecondary)),
                                  Expanded(
                                    child: Text(
                                      m.$3 ?? '',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.red,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.check_circle_rounded,
                                      color: Colors.green, size: 18),
                                  const SizedBox(width: 8),
                                  const Text('সঠিক উত্তর: ',
                                      style: TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textSecondary)),
                                  Expanded(
                                    child: Text(
                                      m.$4 ?? '',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (m.$5 != null && m.$5!.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'ব্যাখ্যা: ${m.$5}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
