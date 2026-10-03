import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../curriculum/presentation/controllers/curriculum_controller.dart';
import '../../../home/presentation/controllers/home_dashboard_controller.dart';

class SubjectProgressDetailPage extends ConsumerWidget {
  final String subjectId;
  const SubjectProgressDetailPage({super.key, required this.subjectId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final home = ref.watch(homeDashboardProvider);
    final repository = ref.watch(curriculumRepositoryProvider);
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.go('/student-progress-dashboard')),
        title: home.maybeWhen(
            data: (data) => Text(data.subjects
                .firstWhere((item) => item.id == subjectId,
                    orElse: () => data.subjects.first)
                .name),
            orElse: () => const Text('বিষয় অগ্রগতি')),
      ),
      body: FutureBuilder(
        future: repository.getMySubjectProgress(subjectId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('একটি সমস্যা হয়েছে: ${snapshot.error}'));
          }
          final chapters = snapshot.data ?? [];
          if (chapters.isEmpty) {
            return const Center(child: Text('কোনো অধ্যায় পাওয়া যায়নি'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: chapters.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (_, index) {
              final chapter = chapters[index];
              return Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border)),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(chapter.title ?? 'অধ্যায় ${index + 1}',
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                          value: chapter.completionRate.clamp(0.0, 1.0),
                          backgroundColor: AppColors.border,
                          valueColor:
                              const AlwaysStoppedAnimation(AppColors.primary)),
                      const SizedBox(height: 6),
                      Text(
                          '${(chapter.completionRate * 100).round()}% সম্পন্ন'),
                    ]),
              );
            },
          );
        },
      ),
    );
  }
}

class MathProgressDetailPage extends StatelessWidget {
  final String subjectId;
  const MathProgressDetailPage({super.key, this.subjectId = 'math'});
  @override
  Widget build(BuildContext context) =>
      SubjectProgressDetailPage(subjectId: subjectId);
}
