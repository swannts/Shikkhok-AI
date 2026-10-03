import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../curriculum/presentation/controllers/curriculum_controller.dart';
import '../../../home/presentation/controllers/home_dashboard_controller.dart';

class SubjectProgressDetailPage extends ConsumerWidget {
  final String subjectId;

  const SubjectProgressDetailPage({super.key, required this.subjectId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final homeDataAsync = ref.watch(homeDashboardProvider);
    final repo = ref.watch(curriculumRepositoryProvider);

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
        title: homeDataAsync.maybeWhen(
          data: (data) {
            final subject = data.subjects.firstWhere(
                (s) => s.id == subjectId,
            final subject = data.subjects.firstWhere((s) => s.id == subjectId,
                orElse: () => data.subjects.first);
            return Text(
              '${subject.name} অগ্রগতি',
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary),
            );
          },
          orElse: () => Text(
            l10n.mathProgressTitle,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primary),
          ),
        ),
      ),
      body: FutureBuilder(
        future: repo.getMySubjectProgress(subjectId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('একটি সমস্যা হয়েছে: ${snapshot.error}'));
          }

          final chapters = snapshot.data ?? [];
          if (chapters.isEmpty) {
            return const Center(child: Text('কোনো অধ্যায় পাওয়া যায়নি'));
          }

          double totalProgress = 0;
          int completedChapters = 0;
          for (var ch in chapters) {
            totalProgress += ch.completionRate;
            if (ch.completionRate >= 1.0) completedChapters++;
          }
          final averageProgress = chapters.isNotEmpty ? totalProgress / chapters.length : 0;
          final averageProgress =
              chapters.isNotEmpty ? totalProgress / chapters.length : 0;

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Overall Hero Card
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 70,
                          height: 70,
                          decoration: const BoxDecoration(
                            color: Colors.white24,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text('${(averageProgress * 100).toInt()}%',
                              style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white)),
                        ),
                        const SizedBox(width: AppSpacing.lg),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('বিষয় মাস্তারি',
                                  style: TextStyle(
                                      fontSize: 14, color: Colors.white70)),
                              const SizedBox(height: 2),
                              const Text('নিয়মিত চর্চা চলছে',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white)),
                              const SizedBox(height: 4),
                              Text('${chapters.length}টির মধ্যে $completedChaptersটি অধ্যায় সম্পন্ন',
                              Text(
                                  '${chapters.length}টির মধ্যে $completedChaptersটি অধ্যায় সম্পন্ন',
                                  style: const TextStyle(
                                      fontSize: 12, color: Colors.white70)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  // Chapter Breakdown
                  const Text(
                    'অধ্যায়ভিত্তিক অগ্রগতি',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: chapters.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final ch = chapters[index];
                      final isComplete = ch.completionRate >= 1.0;
                      final progressColor =
                          isComplete ? Colors.green : AppColors.primary;
                      final progressText = isComplete
                          ? 'সম্পন্ন'
                          : '${(ch.completionRate * 100).toInt()}% সম্পন্ন';

                      return Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text('অধ্যায় ${index + 1}', 
                                  child: Text('অধ্যায় ${index + 1}',
                                      style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary)),
                                ),
                                Text(progressText,
                                    style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: progressColor)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: ch.completionRate,
                                backgroundColor: AppColors.border,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(progressColor),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                    progressColor),
                                minHeight: 6,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
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
  Widget build(BuildContext context) {
    return SubjectProgressDetailPage(subjectId: subjectId);
  }
}
