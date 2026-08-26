import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/router/app_routes.dart';
import '../controllers/exam_controller.dart';

class ExamResultPage extends ConsumerWidget {
  const ExamResultPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final examState = ref.watch(examSessionControllerProvider);

    final result = examState is ExamSessionSubmitted ? examState.result : null;

    final score = result?.score ?? 0;
    final totalMarks = result?.totalMarks ?? 0;
    final percentage = result?.percentage.round() ?? 0;
    final grade = percentage >= 80
        ? 'A+'
        : (percentage >= 70
            ? 'A'
            : (percentage >= 60 ? 'A-' : (percentage >= 50 ? 'B' : 'Passed')));
    final isPassed = result?.isPassed ?? true;
    final timeSpentMin = ((result?.timeSpentSeconds ?? 0) / 60).ceil();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.examLibrary),
        ),
        title: Text(
          l10n.examResultTitle,
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
              // Celebration Badge
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: isPassed ? Colors.green : AppColors.error,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  grade,
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                isPassed
                    ? 'অভিনন্দন! তুমি উত্তীর্ণ হয়েছো!'
                    : 'পুনরায় অনুশীলন করো!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: isPassed ? Colors.green : AppColors.error,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'পরীক্ষার ফলাফল বিবরণী',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Score Grid
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildExamStat(
                          'প্রাপ্ত নম্বর',
                          '$score / $totalMarks',
                          isPassed ? Colors.green : AppColors.error,
                        ),
                        const VerticalDivider(
                            width: 1, color: AppColors.border),
                        _buildExamStat(
                          'সঠিকতা',
                          '$percentage%',
                          AppColors.primary,
                        ),
                      ],
                    ),
                    const Divider(height: 24, color: AppColors.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildExamStat(
                          'ব্যয়িত সময়',
                          '$timeSpentMin মিনিট',
                          AppColors.textPrimary,
                        ),
                        const VerticalDivider(
                            width: 1, color: AppColors.border),
                        _buildExamStat(
                          'স্ট্যাটাস',
                          isPassed ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ',
                          isPassed ? Colors.green : AppColors.error,
                        ),
                      ],
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
                  icon: const Icon(Icons.assignment_outlined,
                      color: Colors.white),
                  label: const Text(
                    'উত্তরপত্র ও সমাধান দেখুন',
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
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () => context.go(AppRoutes.examLibrary),
                  icon: const Icon(Icons.refresh_rounded,
                      color: AppColors.primary),
                  label: const Text(
                    'অন্য পরীক্ষা দিন',
                    style: TextStyle(
                      fontSize: 15,
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
              const SizedBox(height: 10),
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.home),
                icon: const Icon(Icons.home_outlined,
                    color: AppColors.textSecondary),
                label: Text(
                  l10n.backToHome,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExamStat(String title, String val, Color color) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 4),
        Text(
          val,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
