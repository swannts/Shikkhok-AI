import '../../../../core/network/connectivity_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/app_badge.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/student_bottom_navigation.dart';
import '../controllers/curriculum_controller.dart';
import '../../domain/entities/subject.dart';
import '../../../profile/presentation/controllers/student_profile_controller.dart';

class LearnPage extends ConsumerStatefulWidget {
  const LearnPage({super.key});

  @override
  ConsumerState<LearnPage> createState() => _LearnPageState();
}

class _LearnPageState extends ConsumerState<LearnPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadStudentCurriculum();
    });
  }

  Future<void> _loadStudentCurriculum() async {
    await ref.read(studentProfileControllerProvider.notifier).loadProfile();
    if (!mounted) return;

    final profileState = ref.read(studentProfileControllerProvider);
    if (profileState is StudentProfileLoaded) {
      final profile = profileState.profile;
      await ref.read(curriculumControllerProvider.notifier).loadSubjects(
            classLevel: profile.classLevel,
            medium: profile.medium.toApiString(),
            curriculumYear: profile.curriculumYear,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final curriculumState = ref.watch(curriculumControllerProvider);
    final profileState = ref.watch(studentProfileControllerProvider);
    final isOnline = ref.watch(isOnlineProvider);
    final profile =
        profileState is StudentProfileLoaded ? profileState.profile : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(l10n.learnHeader, style: AppTypography.sectionTitle),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: Center(
              child: isOnline
                  ? AppBadge(
                      label: profile == null
                          ? 'প্রোফাইল লোড হচ্ছে'
                          : 'শ্রেণি ${profile.classLevel} • NCTB ${profile.curriculumYear}',
                      variant: AppBadgeVariant.neutral,
                    )
                  : const AppBadge(
                      label: 'অফলাইন ক্যাশ',
                      variant: AppBadgeVariant.warning,
                    ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.auto_stories_rounded,
                        color: AppColors.primary, size: 28),
                    SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('বই পড়ো, AI-এর সাহায্যে শেখো',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              )),
                          SizedBox(height: 3),
                          Text('বই খুলে অধ্যায় ও পাঠ থেকে শেখা শুরু করো',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                              )),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              if (curriculumState is CurriculumLoading) ...[
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                ),
              ] else if (curriculumState is CurriculumFailure) ...[
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            color: AppColors.error, size: 48),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          curriculumState.failure.banglaMessage,
                          textAlign: TextAlign.center,
                          style: AppTypography.body,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton.icon(
                          onPressed: profile == null
                              ? _loadStudentCurriculum
                              : () => ref
                                  .read(curriculumControllerProvider.notifier)
                                  .loadSubjects(
                                    classLevel: profile.classLevel,
                                    medium: profile.medium.toApiString(),
                                    curriculumYear: profile.curriculumYear,
                                  ),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('পুনরায় চেষ্টা করুন'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else if (curriculumState is CurriculumSubjectsLoaded) ...[
                () {
                  final filtered = [...curriculumState.subjects];

                  filtered.sort((a, b) {
                    final order = a.order.compareTo(b.order);
                    return order == 0 ? a.name.compareTo(b.name) : order;
                  });

                  if (filtered.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.search_off_rounded,
                                color: AppColors.textSecondary, size: 48),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'কোনো বিষয় পাওয়া যায়নি',
                              style: AppTypography.body
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: [
                      Row(
                        children: [
                          const Expanded(
                            child: Text('তোমার পাঠ্যবই',
                                style: AppTypography.sectionTitle),
                          ),
                          Text('${filtered.length}টি বই',
                              style: AppTypography.caption
                                  .copyWith(color: AppColors.textSecondary)),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      for (final subject in filtered) ...[
                        _buildDynamicSubjectCard(subject),
                        const SizedBox(height: AppSpacing.sm),
                      ],
                    ],
                  );
                }(),
              ],
            ],
          ),
        ),
      ),
      bottomNavigationBar: const StudentBottomNavigation(),
    );
  }

  Widget _buildDynamicSubjectCard(Subject subject) {
    return AppCard(
      onTap: () => context.go(AppRoutes.subject(subject.id)),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.menu_book_rounded,
                color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(subject.name,
                    style: AppTypography.cardTitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Text(
                    'শ্রেণি ${subject.classLevel} • ${subject.medium.toUpperCase()}',
                    style: AppTypography.caption),
                const SizedBox(height: 4),
                Text('অধ্যায় ও পাঠ • AI শেখার সহায়তা',
                    style: AppTypography.caption
                        .copyWith(color: AppColors.primary, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          const Icon(Icons.chevron_right_rounded,
              color: AppColors.textSecondary),
        ],
      ),
    );
  }
}
