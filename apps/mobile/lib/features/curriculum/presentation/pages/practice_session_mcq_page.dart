import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../practice/presentation/controllers/practice_controller.dart';

class PracticeSessionMcqPage extends ConsumerStatefulWidget {
  const PracticeSessionMcqPage({super.key});

  @override
  ConsumerState<PracticeSessionMcqPage> createState() =>
      _PracticeSessionMcqPageState();
}

class _PracticeSessionMcqPageState
    extends ConsumerState<PracticeSessionMcqPage> {
  @override
  Widget build(BuildContext context) {
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
                      color: AppColors.textPrimary),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'সঠিক উত্তর: ${practiceState.correctCount} / ${practiceState.totalQuestions}',
                  style: const TextStyle(
                      fontSize: 16, color: AppColors.textSecondary),
                ),
                const SizedBox(height: AppSpacing.xl),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => context.go('/practice-result'),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary),
                    child: const Text('ফলাফল দেখুন',
                        style: TextStyle(color: Colors.white, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final activeSession =
        practiceState is PracticeActiveSession ? practiceState : null;

    final currentQuestion = activeSession?.currentQuestion;
    final questionText =
        currentQuestion?.prompt ?? 'যদি 2x + 6 = 12 হয়, তবে x এর মান কত?';
    final options = (currentQuestion?.options.isNotEmpty ?? false)
        ? currentQuestion!.options
        : const ['২', '৩', '৪', '৫'];

    final currentNumber = (activeSession?.currentIndex ?? 0) + 1;
    final totalCount = activeSession?.totalQuestions ?? 10;
    final progressValue = totalCount > 0 ? currentNumber / totalCount : 0.3;

    final selectedOption = activeSession?.selectedOptionId;
    final submittedResult = activeSession?.currentResult;
    final isSubmitted = submittedResult != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/practice-setup'),
        ),
        title: Text(
          l10n.questionProgress(currentNumber, totalCount),
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary),
        ),
        centerTitle: true,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: AppSpacing.md),
            child: Row(
              children: [
                Icon(Icons.timer_outlined, color: Colors.red, size: 18),
                SizedBox(width: 4),
                Text(
                  '০৪:২৮',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.red),
                ),
              ],
            ),
          ),
        ],
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
                              const Icon(Icons.bookmark_border_rounded,
                                  color: AppColors.textSecondary),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            questionText,
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
                      final optionId = 'option-$index';
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
                                color: Colors.green);
                          } else {
                            borderColor = Colors.red;
                            bgColor = Colors.red.withAlpha(20);
                            trailingIcon = const Icon(Icons.cancel_rounded,
                                color: Colors.red);
                          }
                        }
                      } else if (isSelected) {
                        borderColor = AppColors.primary;
                        bgColor = AppColors.primary.withAlpha(20);
                        trailingIcon = const Icon(
                            Icons.radio_button_checked_rounded,
                            color: AppColors.primary);
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
                                  width: isSelected ? 2 : 1),
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
                                      color: AppColors.textPrimary,
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
                  ],
                ),
              ),
            ),

            // Bottom Verification Action Bar
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
                  onPressed: isSubmitted
                      ? () => notifier.nextQuestion()
                      : (selectedOption != null
                          ? () => notifier.submitCurrentAnswer()
                          : null),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    isSubmitted
                        ? (activeSession?.isLastQuestion ?? false
                            ? 'ফলাফল দেখুন'
                            : 'পরবর্তী প্রশ্ন')
                        : 'উত্তর যাচাই করুন',
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
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
