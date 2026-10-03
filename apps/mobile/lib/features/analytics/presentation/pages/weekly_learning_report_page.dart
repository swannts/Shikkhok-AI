import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../curriculum/presentation/controllers/curriculum_controller.dart';
import '../../../home/presentation/controllers/home_dashboard_controller.dart';

class WeeklyLearningReportPage extends ConsumerWidget {
  const WeeklyLearningReportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final progressAsync = ref.watch(progressSummaryFutureProvider);
    final gamificationAsync = ref.watch(gamificationSummaryFutureProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/student-progress-dashboard'),
        ),
        title: Text(
          l10n.weeklyReportTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: progressAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) =>
            Center(child: Text('একটি সমস্যা হয়েছে: $error')),
        data: (progressSummary) {
          return gamificationAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) =>
                Center(child: Text('একটি সমস্যা হয়েছে: $error')),
            data: (gamificationSummary) {
              final totalMinutes = progressSummary.totalMinutesStudied;
              final hours = totalMinutes ~/ 60;
              final mins = totalMinutes % 60;
              final timeString =
                  hours > 0 ? '$hours ঘণ্টা $mins মিনিট' : '$mins মিনিট';

              final averageScore = (progressSummary.averageScore * 100).toInt();
              final lessonsCompleted = progressSummary.totalLessonsCompleted;
              final practiceSessions = progressSummary.totalPracticeSessions;
              final streakDays = gamificationSummary.streakDays;

              return SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Summary Banner Card
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('এই সপ্তাহ',
                                style: TextStyle(
                                    fontSize: 14, color: Colors.white70)),
                            const SizedBox(height: 4),
                            Text('$timeString মোট পড়াশোনা',
                                style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white)),
                            const SizedBox(height: AppSpacing.md),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('গড় নম্বর: $averageScore%',
                                    style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white)),
                                Text('$lessonsCompletedটি পাঠ সম্পন্ন',
                                    style: const TextStyle(
                                        fontSize: 14, color: Colors.white70)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      const Text('সাপ্তাহিক হাইলাইটস',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.quiz_rounded,
                                      color: Colors.green, size: 28),
                                  const SizedBox(height: 8),
                                  Text('$practiceSessionsটি সেশন',
                                      style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary)),
                                  const Text('অনুশীলন করা হয়েছে',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(
                                      Icons.local_fire_department_rounded,
                                      color: Colors.deepOrange,
                                      size: 28),
                                  const SizedBox(height: 8),
                                  Text('$streakDays দিন টানা',
                                      style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary)),
                                  const Text('পড়াশোনার রেকর্ড',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      // AI Insight Recommendation Card
                      if (practiceSessions > 0 || lessonsCompleted > 0)
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.lightbulb_rounded,
                                      color: Colors.amber, size: 22),
                                  SizedBox(width: 8),
                                  Text('AI শিক্ষকের টিপস',
                                      style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary)),
                                ],
                              ),
                              SizedBox(height: 8),
                              Text(
                                'এই সপ্তাহে তোমার অগ্রগতি দারুণ! আগামী সপ্তাহে নতুন অধ্যায়গুলো আরও প্র্যাকটিস করলে অনেক ভালো করা সম্ভব।',
                                style: TextStyle(
                                    fontSize: 14,
                                    height: 1.5,
                                    color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
