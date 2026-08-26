import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/router/app_routes.dart';

class ChapterDetailsPage extends StatelessWidget {
  final String? chapterId;

  const ChapterDetailsPage({super.key, this.chapterId});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.learn),
        ),
        title: Text(
          l10n.chapterDetailsTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Hero Title
                    Text(
                      l10n.algebraFormulas,
                      style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.mathClass8,
                      style: const TextStyle(
                          fontSize: 14, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Chapter Progress Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(5),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(l10n.chapterComplete,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary)),
                                  const SizedBox(height: 2),
                                  const Text('৪২%',
                                      style: TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary)),
                                ],
                              ),
                              Text(l10n.lessonsDone,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary)),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: const LinearProgressIndicator(
                              value: 0.42,
                              backgroundColor: AppColors.border,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.primary),
                              minHeight: 8,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () =>
                                      context.go(AppRoutes.practiceSetup),
                                  icon: const Icon(Icons.edit_note_rounded,
                                      size: 20, color: Colors.white),
                                  label: Text(l10n.practiceAction,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(14)),
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                  ),
                                ),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withAlpha(20),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppColors.primary),
                                ),
                                child: const Icon(Icons.download_rounded,
                                    color: AppColors.primary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      l10n.lessonsList,
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // Lesson Items
                    _buildLessonTile(
                      icon: Icons.check_circle_rounded,
                      iconColor: Colors.green,
                      title: l10n.lesson1,
                      isCompleted: true,
                      onTap: () => context.go(AppRoutes.lesson('lesson_1')),
                    ),
                    const SizedBox(height: 10),
                    _buildLessonTile(
                      icon: Icons.check_circle_rounded,
                      iconColor: Colors.green,
                      title: l10n.lesson2,
                      isCompleted: true,
                      onTap: () => context.go(AppRoutes.lesson('lesson_2')),
                    ),
                    const SizedBox(height: 10),
                    _buildLessonTile(
                      icon: Icons.play_circle_fill_rounded,
                      iconColor: AppColors.primary,
                      title: l10n.lesson3,
                      isInProgress: true,
                      onTap: () => context.go(AppRoutes.lesson('lesson_3')),
                    ),
                    const SizedBox(height: 10),
                    _buildLessonTile(
                      icon: Icons.play_circle_outline_rounded,
                      iconColor: AppColors.textSecondary,
                      title: l10n.lesson4,
                      timeBadge: '১৫ মিনিট',
                      onTap: () => context.go(AppRoutes.lesson('lesson_4')),
                    ),
                    const SizedBox(height: 10),
                    _buildLessonTile(
                      icon: Icons.lock_rounded,
                      iconColor: AppColors.textSecondary,
                      title: l10n.lesson5,
                      isLocked: true,
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Exam Action
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () => context.go(AppRoutes.examLibrary),
                  icon: const Icon(Icons.assignment_outlined,
                      color: AppColors.primary),
                  label: Text(
                    l10n.chapterExam,
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.primary, width: 2),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLessonTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    bool isCompleted = false,
    bool isInProgress = false,
    bool isLocked = false,
    String? timeBadge,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: isLocked ? null : onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isLocked ? AppColors.background : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isInProgress ? AppColors.primary : AppColors.border,
            width: isInProgress ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 26),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isLocked
                      ? AppColors.textSecondary
                      : AppColors.textPrimary,
                ),
              ),
            ),
            if (timeBadge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  timeBadge,
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
