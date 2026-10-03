import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/router/app_routes.dart';
import '../../../curriculum/presentation/controllers/curriculum_controller.dart';
import '../../../home/presentation/controllers/home_dashboard_controller.dart';
import '../../../curriculum/domain/entities/subject.dart';

class StudentProgressDashboardPage extends ConsumerWidget {
  const StudentProgressDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final progressAsync = ref.watch(progressSummaryFutureProvider);
    final homeDataAsync = ref.watch(homeDashboardProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.myProgressTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: progressAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('একটি সমস্যা হয়েছে: $error')),
        error: (error, stack) =>
            Center(child: Text('একটি সমস্যা হয়েছে: $error')),
        data: (progressSummary) {
          return homeDataAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(child: Text('একটি সমস্যা হয়েছে: $error')),
            error: (error, stack) =>
                Center(child: Text('একটি সমস্যা হয়েছে: $error')),
            data: (homeData) {
              final subjects = homeData.subjects;
              final averageScore = progressSummary.averageScore;
              final streakDays = progressSummary.streakDays;
              final totalMinutes = progressSummary.totalMinutesStudied;
              final subjectMastery = progressSummary.subjectMastery;

              return SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hero Summary Card
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                SizedBox(
                                  width: 80,
                                  height: 80,
                                  child: CircularProgressIndicator(
                                    value: averageScore,
                                    strokeWidth: 8,
                                    backgroundColor: AppColors.border,
                                    valueColor: const AlwaysStoppedAnimation<Color>(
                                        AppColors.primary),
                                    valueColor:
                                        const AlwaysStoppedAnimation<Color>(
                                            AppColors.primary),
                                  ),
                                ),
                                Text('${(averageScore * 100).toInt()}%',
                                    style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary)),
                              ],
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('গড় শিখনের অগ্রগতি',
                                      style: TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textSecondary)),
                                  const SizedBox(height: 2),
                                  const Text('দারুণ পারফরম্যান্স!',
                                      style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary)),
                                  const SizedBox(height: 4),
                                  Text('🔥 $streakDays দিন টানা পড়ার রেকর্ড',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.deepOrange)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      // Time Spent Summary Card
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
                            _buildTimeMetric('মোট সময়', '$totalMinutes মিনিট',
                                AppColors.primary),
                            const VerticalDivider(
                                width: 1, color: AppColors.border),
                            _buildTimeMetric(
                                'মোট সময়', '$totalMinutes মিনিট', AppColors.primary),
                            const VerticalDivider(width: 1, color: AppColors.border),
                            _buildTimeMetric(
                                'এই সপ্তাহে', '${(totalMinutes / 60).toStringAsFixed(1)} ঘণ্টা', Colors.green),
                                'এই সপ্তাহে',
                                '${(totalMinutes / 60).toStringAsFixed(1)} ঘণ্টা',
                                Colors.green),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      // Subject Mastery Cards
                      const Text(
                        'বিষয়ভিত্তিক অগ্রগতি',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      if (subjects.isEmpty)
                        const Center(child: Text('কোনো বিষয় পাওয়া যায়নি'))
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 1.1,
                          ),
                          itemCount: subjects.length,
                          itemBuilder: (context, index) {
                            final sub = subjects[index];
                            final mastery = (subjectMastery[sub.id] as num?)?.toDouble() ?? 0.0;
                            
                            final mastery =
                                (subjectMastery[sub.id] as num?)?.toDouble() ??
                                    0.0;

                            Color color = AppColors.primary;
                            IconData icon = Icons.menu_book_rounded;
                            
                            if (sub.name.contains('গণিত') || sub.name.contains('Math')) {

                            if (sub.name.contains('গণিত') ||
                                sub.name.contains('Math')) {
                              color = AppColors.primary;
                              icon = Icons.calculate_rounded;
                            } else if (sub.name.contains('বিজ্ঞান') || sub.name.contains('Science')) {
                            } else if (sub.name.contains('বিজ্ঞান') ||
                                sub.name.contains('Science')) {
                              color = Colors.green;
                              icon = Icons.science_rounded;
                            } else if (sub.name.contains('English') || sub.name.contains('ইংরেজি')) {
                            } else if (sub.name.contains('English') ||
                                sub.name.contains('ইংরেজি')) {
                              color = Colors.orange;
                              icon = Icons.language_rounded;
                            } else if (sub.name.contains('বাংলা')) {
                              color = Colors.teal;
                              icon = Icons.menu_book_rounded;
                            }

                            return InkWell(
                              onTap: () => context.go(AppRoutes.subject(sub.id)),
                              onTap: () =>
                                  context.go(AppRoutes.subject(sub.id)),
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.all(AppSpacing.md),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Icon(icon, color: color, size: 28),
                                        Text('${(mastery * 100).toInt()}%',
                                            style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: color)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(sub.name,
                                            style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.textPrimary),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                        Text(
                                          sub.name,
                                          style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 6),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          borderRadius:
                                              BorderRadius.circular(4),
                                          child: LinearProgressIndicator(
                                            value: mastery,
                                            backgroundColor: AppColors.border,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(color),
                                                AlwaysStoppedAnimation<Color>(
                                                    color),
                                            minHeight: 6,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
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

  Widget _buildTimeMetric(String title, String time, Color color) {
    return Column(
      children: [
        Text(title,
            style:
                const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Text(time,
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}
