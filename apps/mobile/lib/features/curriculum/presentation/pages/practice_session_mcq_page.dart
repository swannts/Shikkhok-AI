import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/router/app_routes.dart';
import '../../../practice/presentation/controllers/practice_controller.dart';

class PracticeSessionMcqPage extends ConsumerWidget {
  const PracticeSessionMcqPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final practiceState = ref.watch(practiceControllerProvider);
    final notifier = ref.read(practiceControllerProvider.notifier);

    if (practiceState is PracticeLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (practiceState is PracticeError) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: Text(l10n.practiceTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded,
                color: AppColors.textPrimary),
            onPressed: () => context.go(AppRoutes.practiceSetup),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.error, size: 48),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  practiceState.message,
                  textAlign: TextAlign.center,
                  style: AppTypography.body,
                ),
                const SizedBox(height: AppSpacing.md),
                ElevatedButton(
                  onPressed: () => context.go(AppRoutes.practiceSetup),
                  child: const Text('অনুশীলন পৃষ্ঠায় ফিরে যান'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (practiceState is PracticeSessionCompleted) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_rounded,
                    color: AppColors.primary, size: 64),
                const SizedBox(height: AppSpacing.md),
                const Text(
                  'অনুশীলন সম্পন্ন হয়েছে!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'সঠিক উত্তর: ${practiceState.correctCount} / ${practiceState.totalQuestions}',
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => context.go(AppRoutes.practiceResult),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: const Text(
                      'ফলাফল দেখুন',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (practiceState is! PracticeActiveSession) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: Text(l10n.practiceTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded,
                color: AppColors.textPrimary),
            onPressed: () => context.go(AppRoutes.practiceSetup),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.quiz_outlined,
                  color: AppColors.textSecondary, size: 48),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'কোনো সক্রিয় অনুশীলন সেশন নেই',
                style: AppTypography.body,
              ),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => context.go(AppRoutes.practiceSetup),
                child: const Text('নতুন অনুশীলন শুরু করুন'),
              ),
            ],
          ),
        ),
      );
    }

    final activeSession = practiceState;
    final currentQuestion = activeSession.currentQuestion;
    final options = currentQuestion.options;
    final currentNumber = activeSession.currentIndex + 1;
    final totalCount = activeSession.totalQuestions;
    final progressValue = totalCount > 0 ? currentNumber / totalCount : 0.0;

    final selectedOption = activeSession.selectedOptionId;
    final submittedResult = activeSession.currentResult;
    final isSubmitted = submittedResult != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.practiceSetup),
        ),
        title: Text(
          l10n.questionProgress(currentNumber, totalCount),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: progressValue,
            backgroundColor: AppColors.border,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 4,
          ),
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
                    // Question Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withAlpha(20),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'প্রশ্ন $currentNumber',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            currentQuestion.prompt,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              height: 1.5,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),

                    // Options List
                    ...List.generate(options.length, (index) {
                      final optionId = 'opt_$index';
                      final optionLabel =
                          String.fromCharCode(65 + index); // A, B, C, D
                      final optionText = options[index];
                      final isSelected = selectedOption == optionId ||
                          selectedOption == optionText;

                      Color borderColor = AppColors.border;
                      Color bgColor = AppColors.surface;
                      Widget? trailingIcon;

                      if (isSubmitted) {
                        if (isSelected) {
                          if (submittedResult.isCorrect) {
                            borderColor = Colors.green;
                            bgColor = Colors.green.withAlpha(20);
                            trailingIcon = const Icon(
                              Icons.check_circle_rounded,
                              color: Colors.green,
                            );
                          } else {
                            borderColor = Colors.red;
                            bgColor = Colors.red.withAlpha(20);
                            trailingIcon = const Icon(
                              Icons.cancel_rounded,
                              color: Colors.red,
                            );
                          }
                        }
                      } else if (isSelected) {
                        borderColor = AppColors.primary;
                        bgColor = AppColors.primary.withAlpha(20);
                        trailingIcon = const Icon(
                          Icons.radio_button_checked_rounded,
                          color: AppColors.primary,
                        );
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: InkWell(
                          onTap: isSubmitted
                              ? null
                              : () => notifier.selectOption(optionId),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: borderColor,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.surfaceMuted,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      optionLabel,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected
                                            ? Colors.white
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Text(
                                    optionText,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: isSelected
                                          ? AppColors.textPrimary
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                                if (trailingIcon != null) trailingIcon,
                              ],
                            ),
                          ),
                        ),
                      );
                    }),

                    if (isSubmitted && submittedResult.explanation != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.lightbulb_outline_rounded,
                                    color: AppColors.primary, size: 20),
                                SizedBox(width: 6),
                                Text(
                                  'ব্যাখ্যা',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              submittedResult.explanation!,
                              style: AppTypography.body,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: isSubmitted
                    ? ElevatedButton.icon(
                        onPressed: () => notifier.nextQuestion(),
                        icon: const Icon(Icons.arrow_forward_rounded,
                            color: Colors.white),
                        label: Text(
                          activeSession.isLastQuestion
                              ? 'ফলাফল দেখুন'
                              : 'পরবর্তী প্রশ্ন',
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
                      )
                    : ElevatedButton(
                        onPressed:
                            selectedOption == null || activeSession.isSubmitting
                                ? null
                                : () => notifier.submitCurrentAnswer(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: activeSession.isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'যাচাই করো',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
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
}
