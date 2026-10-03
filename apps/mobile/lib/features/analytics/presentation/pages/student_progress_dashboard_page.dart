import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../curriculum/presentation/controllers/curriculum_controller.dart';
import '../../../home/presentation/controllers/home_dashboard_controller.dart';

class StudentProgressDashboardPage extends ConsumerWidget {
  const StudentProgressDashboardPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress = ref.watch(progressSummaryFutureProvider);
    final home = ref.watch(homeDashboardProvider);
    return Scaffold(
      appBar: AppBar(
          leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded),
              onPressed: () => context.go(AppRoutes.home)),
          title: const Text('আমার অগ্রগতি')),
      body: progress.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('একটি সমস্যা হয়েছে: $error')),
        data: (summary) => home.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('একটি সমস্যা হয়েছে: $error')),
          data: (dashboard) => ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border)),
                  child: Row(children: [
                    SizedBox(
                        width: 76,
                        height: 76,
                        child: CircularProgressIndicator(
                            value: summary.averageScore.clamp(0.0, 1.0),
                            strokeWidth: 8,
                            backgroundColor: AppColors.border,
                            valueColor: const AlwaysStoppedAnimation(
                                AppColors.primary))),
                    const SizedBox(width: AppSpacing.lg),
                    Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${(summary.averageScore * 100).round()}%',
                              style: const TextStyle(
                                  fontSize: 22, fontWeight: FontWeight.bold)),
                          Text('${summary.streakDays} দিন টানা পড়া'),
                          Text('${summary.totalMinutesStudied} মিনিট পড়াশোনা')
                        ]),
                  ])),
              const SizedBox(height: AppSpacing.xl),
              const Text('বিষয়ভিত্তিক অগ্রগতি',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: AppSpacing.md),
              if (dashboard.subjects.isEmpty)
                const Text('কোনো বিষয় পাওয়া যায়নি')
              else
                ...dashboard.subjects.map((subject) {
                  final mastery = (summary.subjectMastery[subject.id] as num?)
                          ?.toDouble() ??
                      0;
                  return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(subject.name),
                      subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: LinearProgressIndicator(
                              value: mastery.clamp(0.0, 1.0),
                              backgroundColor: AppColors.border,
                              valueColor: const AlwaysStoppedAnimation(
                                  AppColors.primary))),
                      trailing: Text('${(mastery * 100).round()}%'),
                      onTap: () => context.go(AppRoutes.subject(subject.id)));
                }),
            ],
          ),
        ),
      ),
    );
  }
}
