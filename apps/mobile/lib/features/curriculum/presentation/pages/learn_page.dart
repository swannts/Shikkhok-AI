import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/app_badge.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/app_progress_bar.dart';
import '../../../../shared/widgets/app_search_field.dart';

class LearnPage extends StatefulWidget {
  const LearnPage({super.key});

  @override
  State<LearnPage> createState() => _LearnPageState();
}

class _LearnPageState extends State<LearnPage> {
  int _selectedFilterIndex = 0;
  int _currentNavIndex = 1;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

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
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
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
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
                        ),
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedFilterIndex = index);
                        },
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                childAspectRatio: 0.88,
                crossAxisSpacing: AppSpacing.smd,
                mainAxisSpacing: AppSpacing.smd,
                children: [
                  _buildSubjectCard(
                    title: l10n.subjectMath,
                    subtitle: 'Mathematics',
                    icon: Icons.calculate_rounded,
                    bgColor: AppColors.primaryLight,
                    iconColor: AppColors.primaryDark,
                    chapters: 12,
                    lessons: 48,
                    progress: 0.62,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectScience,
                    subtitle: 'Science',
                    icon: Icons.science_rounded,
                    bgColor: AppColors.successLight,
                    iconColor: AppColors.success,
                    chapters: 14,
                    lessons: 52,
                    progress: 0.48,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectBangla,
                    subtitle: 'Bangla',
                    icon: Icons.menu_book_rounded,
                    bgColor: AppColors.warningLight,
                    iconColor: AppColors.warning,
                    chapters: 10,
                    lessons: 40,
                    progress: 0.75,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectEnglish,
                    subtitle: 'English',
                    icon: Icons.language_rounded,
                    bgColor: AppColors.secondaryLight,
                    iconColor: AppColors.secondary,
                    chapters: 15,
                    lessons: 60,
                    progress: 0.30,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectIct,
                    subtitle: 'Information Tech',
                    icon: Icons.computer_rounded,
                    bgColor: AppColors.infoLight,
                    iconColor: AppColors.info,
                    chapters: 8,
                    lessons: 32,
                    progress: 0.90,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectSocial,
                    subtitle: 'Social Science',
                    icon: Icons.public_rounded,
                    bgColor: AppColors.surfaceMuted,
                    iconColor: AppColors.textSecondary,
                    chapters: 12,
                    lessons: 45,
                    progress: 0.55,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentNavIndex,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textDisabled,
        backgroundColor: AppColors.surface,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() => _currentNavIndex = index);
          if (index == 0) context.go('/');
          if (index == 2) context.go('/practice-setup');
          if (index == 3) context.go('/ai-tutor-chat');
          if (index == 4) context.go('/profile');
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home_rounded), label: 'হোম'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), activeIcon: Icon(Icons.menu_book_rounded), label: 'শিখুন'),
          BottomNavigationBarItem(icon: Icon(Icons.quiz_outlined), activeIcon: Icon(Icons.quiz_rounded), label: 'প্র্যাকটিস'),
          BottomNavigationBarItem(icon: Icon(Icons.smart_toy_outlined), activeIcon: Icon(Icons.smart_toy_rounded), label: 'AI শিক্ষক'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline_rounded), activeIcon: Icon(Icons.person_rounded), label: 'প্রোফাইল'),
        ],
      ),
    );
  }

  Widget _buildSubjectCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color bgColor,
    required Color iconColor,
    required int chapters,
    required int lessons,
    required double progress,
  }) {
    return AppCard(
      onTap: () => context.go('/subject-details'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            title,
            style: AppTypography.cardTitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(subtitle, style: AppTypography.caption),
          const Spacer(),
          Text('$chapters অধ্যায় • $lessons পাঠ', style: AppTypography.caption.copyWith(fontSize: 11)),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              Expanded(child: AppProgressBar(value: progress, height: 6)),
              const SizedBox(width: AppSpacing.xs),
              Text(
                '${(progress * 100).toInt()}%',
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
