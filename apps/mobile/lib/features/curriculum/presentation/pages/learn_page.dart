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
import '../../../../shared/widgets/app_progress_bar.dart';
import '../../../../shared/widgets/app_search_field.dart';
import '../controllers/curriculum_controller.dart';
import '../../domain/entities/subject.dart';

class LearnPage extends ConsumerStatefulWidget {
  const LearnPage({super.key});

  @override
  ConsumerState<LearnPage> createState() => _LearnPageState();
}

class _LearnPageState extends ConsumerState<LearnPage> {
  int _selectedFilterIndex = 0;
  int _currentNavIndex = 1;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(curriculumControllerProvider.notifier).loadSubjects(
            classLevel: 8,
            medium: 'bangla',
            curriculumYear: 2026,
          );
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final curriculumState = ref.watch(curriculumControllerProvider);

    final filters = [
      l10n.allSubjects,
      l10n.scienceGroup,
      l10n.humanitiesGroup,
      l10n.businessGroup,
    ];

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
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: AppSpacing.md),
            child: Center(
              child: AppBadge(
                label: '৮ম শ্রেণি • NCTB ২০২৬',
                variant: AppBadgeVariant.neutral,
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
              AppSearchField(
                controller: _searchController,
                hintText: l10n.searchSubjectPlaceholder,
              ),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                height: 38,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  itemBuilder: (context, index) {
                    final isSelected = _selectedFilterIndex == index;
                    return Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.sm),
                      child: ChoiceChip(
                        label: Text(filters[index]),
                        selected: isSelected,
                        selectedColor: AppColors.primaryLight,
                        backgroundColor: AppColors.surfaceMuted,
                        labelStyle: AppTypography.caption.copyWith(
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected
                              ? AppColors.primaryDark
                              : AppColors.textSecondary,
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedFilterIndex = index);
                          }
                        },
                      ),
                    );
                  },
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
                          onPressed: () => ref
                              .read(curriculumControllerProvider.notifier)
                              .loadSubjects(
                                classLevel: 8,
                                medium: 'bangla',
                                curriculumYear: 2026,
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
                  final query = _searchController.text.trim().toLowerCase();
                  final filtered = curriculumState.subjects.where((s) {
                    if (query.isEmpty) return true;
                    return s.name.toLowerCase().contains(query) ||
                        s.slug.toLowerCase().contains(query);
                  }).toList();

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

                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.88,
                      crossAxisSpacing: AppSpacing.smd,
                      mainAxisSpacing: AppSpacing.smd,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final subject = filtered[index];
                      return _buildDynamicSubjectCard(subject);
                    },
                  );
                }(),
              ],
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentNavIndex,
        onDestinationSelected: (index) {
          setState(() => _currentNavIndex = index);
          switch (index) {
            case 0:
              context.go('/');
              break;
            case 1:
              break;
            case 2:
              context.go('/ai-tutor-chat');
              break;
            case 3:
              context.go('/practice-setup');
              break;
            case 4:
              context.go('/student-profile');
              break;
          }
        },
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: 'হোম'),
          NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book_rounded),
              label: 'শিক্ষা'),
          NavigationDestination(
              icon: Icon(Icons.smart_toy_outlined),
              selectedIcon: Icon(Icons.smart_toy_rounded),
              label: 'টিউটর'),
          NavigationDestination(
              icon: Icon(Icons.quiz_outlined),
              selectedIcon: Icon(Icons.quiz_rounded),
              label: 'অনুশীলন'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'প্রোফাইল'),
        ],
      ),
    );
  }

  Widget _buildDynamicSubjectCard(Subject subject) {
    return AppCard(
      onTap: () => context.go(AppRoutes.subject(subject.id)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu_book_rounded,
                    color: AppColors.primaryDark),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: AppColors.textSecondary, size: 20),
            ],
          ),
          const Spacer(),
          Text(subject.name,
              style: AppTypography.cardTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          Text(
            'শ্রেণি ${subject.classLevel} • ${subject.medium.toUpperCase()}',
            style: AppTypography.caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.xs + 2),
          const AppProgressBar(value: 0.0),
        ],
      ),
    );
  }
}
