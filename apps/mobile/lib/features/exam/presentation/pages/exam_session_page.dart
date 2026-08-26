import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../controllers/exam_controller.dart';

class ExamSessionPage extends ConsumerStatefulWidget {
  final String? examId;
  final String? sessionId;

  const ExamSessionPage({
    super.key,
    this.examId,
    this.sessionId,
  });

  @override
  ConsumerState<ExamSessionPage> createState() => _ExamSessionPageState();
}

class _ExamSessionPageState extends ConsumerState<ExamSessionPage> {
  @override
  void initState() {
    super.initState();
    if (widget.examId != null && widget.examId!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(examSessionControllerProvider.notifier)
            .startExam(widget.examId!);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final examState = ref.watch(examSessionControllerProvider);
    final notifier = ref.read(examSessionControllerProvider.notifier);

    if (widget.examId == null || widget.examId!.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: Text(l10n.examLibraryTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded,
                color: AppColors.textPrimary),
            onPressed: () => context.go(AppRoutes.examLibrary),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  color: AppColors.error, size: 48),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'পরীক্ষা আইডি সঠিক নয়',
                style: AppTypography.body,
              ),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => context.go(AppRoutes.examLibrary),
                child: const Text('পরীক্ষা তালিকায় ফিরে যান'),
              ),
            ],
          ),
        ),
      );
    }

    if (examState is ExamSessionLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (examState is ExamSessionError) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: Text(l10n.examLibraryTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded,
                color: AppColors.textPrimary),
            onPressed: () => context.go(AppRoutes.examLibrary),
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
                  examState.message,
                  textAlign: TextAlign.center,
                  style: AppTypography.body,
                ),
                const SizedBox(height: AppSpacing.md),
                ElevatedButton(
                  onPressed: () => notifier.startExam(widget.examId!),
                  child: const Text('পুনরায় চেষ্টা করুন'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (examState is ExamSessionSubmitted) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle_rounded,
                    color: AppColors.primary, size: 64),
                const SizedBox(height: AppSpacing.md),
                const Text(
                  'পরীক্ষা সফলভাবে জমা দেওয়া হয়েছে!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'প্রাপ্ত নম্বর: ${examState.result.score} / ${examState.result.totalMarks}',
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
                    onPressed: () => context.go(AppRoutes.examResult),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: const Text(
                      'ফলাফল বিস্তারিত দেখুন',
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

    if (examState is! ExamSessionActive) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final activeSession = examState;
    final currentQ = activeSession.currentQuestion;
    final currentIdx = activeSession.currentQuestionIndex;
    final totalQ = activeSession.totalQuestions;
    final progressVal = totalQ > 0 ? (currentIdx + 1) / totalQ : 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => _showExitDialog(context),
        ),
        title: Text(
          l10n.questionProgress(currentIdx + 1, totalQ),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: Row(
              children: [
                const Icon(Icons.timer_outlined,
                    color: AppColors.primary, size: 18),
                const SizedBox(width: 4),
                Text(
                  '${activeSession.session.durationMinutes}:০০',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: progressVal,
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
                                  'প্রশ্ন ${currentIdx + 1}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: Icon(
                                  currentQ.isFlagged
                                      ? Icons.bookmark_rounded
                                      : Icons.bookmark_border_rounded,
                                  color: currentQ.isFlagged
                                      ? Colors.amber
                                      : AppColors.textSecondary,
                                ),
                                onPressed: () => notifier.toggleFlag(),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            currentQ.prompt,
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
                    ...List.generate(currentQ.options.length, (index) {
                      final optionId = 'opt_$index';
                      final optionLabel =
                          String.fromCharCode(65 + index); // A, B, C, D
                      final optionText = currentQ.options[index];
                      final isSelected =
                          currentQ.selectedOptionId == optionId ||
                              currentQ.selectedOptionId == optionText;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: InkWell(
                          onTap: () => notifier.selectAnswer(optionId),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
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
                                          ? AppColors.primary
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(
                                    Icons.radio_button_checked_rounded,
                                    color: AppColors.primary,
                                  ),
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

            // Bottom Navigation & Submit Bar
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  if (currentIdx > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => notifier.previousQuestion(),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('পূর্ববর্তী',
                            style: TextStyle(fontSize: 15)),
                      ),
                    ),
                  if (currentIdx > 0) const SizedBox(width: AppSpacing.md),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: activeSession.isLastQuestion
                          ? () => _showSubmitDialog(context, notifier)
                          : () => notifier.nextQuestion(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        activeSession.isLastQuestion
                            ? 'পরীক্ষা জমা দিন'
                            : 'পরবর্তী',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSubmitDialog(BuildContext context, ExamSessionController notifier) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('পরীক্ষা জমা দেবেন?'),
        content: const Text(
            'আপনি কি নিশ্চিত যে আপনি পরীক্ষা সম্পন্ন করে ফলাফল দেখতে চান?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('ফিরে যান'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              notifier.submitExam();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
            child: const Text('জমা দিন', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showExitDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('পরীক্ষা থেকে বের হবেন?'),
        content: const Text('আপনার উত্তর সংরক্ষিত থাকবে।'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('চালিয়ে যান'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.go(AppRoutes.examLibrary);
            },
            child: const Text('বের হন', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
