import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/app_avatar.dart';
import '../../../../shared/widgets/app_badge.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/app_progress_bar.dart';
import '../../../../shared/widgets/app_section_header.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        title: Row(
          children: [
            const AppAvatar(initials: 'র', isOnline: true),
            const SizedBox(width: AppSpacing.smd),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.greetingMorning('রাফি'), style: AppTypography.cardTitle),
                Text(l10n.greetingSubtitle, style: AppTypography.caption),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: AppColors.textPrimary),
            onPressed: () => context.go('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.search_rounded, color: AppColors.textPrimary),
            onPressed: () => context.go('/global-search'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Main Progress Overview Card
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('আজকের অগ্রগতি', style: AppTypography.cardTitle),
                        AppBadge(label: '৭ দিন টানা 🔥', variant: AppBadgeVariant.warning),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.smd),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('সামগ্রিক মাস্তারি: ৭২%', style: AppTypography.caption),
                        Text('৪৫ / ৬০ মি', style: AppTypography.caption),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs + 2),
                    const AppProgressBar(value: 0.72),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildMiniStat('পড়াশোনা', '৪৫ মি', Icons.timer_rounded),
                        _buildMiniStat('প্রশ্ন', '২৮টি', Icons.quiz_rounded),
                        _buildMiniStat('সঠিকতা', '৮৮%', Icons.check_circle_rounded),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // Today's Recommended Study Task
              AppSectionHeader(
                title: l10n.todaysStudyPlan,
                actionLabel: l10n.seeAll,
                onActionTap: () => context.go('/todays-study-plan'),
              ),
              const SizedBox(height: AppSpacing.xs),
              AppCard(
                onTap: () => context.go('/lesson-reader'),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.menu_book_rounded, color: AppColors.primaryDark),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('সরল সমীকরণ সমাধান', style: AppTypography.cardTitle),
                          SizedBox(height: 2),
                          Text('গণিত • অধ্যায় ৪ • ১৫ মিনিট', style: AppTypography.caption),
                        ],
                      ),
                    ),
                    const Icon(Icons.play_circle_fill_rounded, color: AppColors.primary, size: 32),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // Quick Action Grid (2-column compact cards)
              const AppSectionHeader(title: 'দ্রুত সেবা'),
              const SizedBox(height: AppSpacing.xs),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: AppSpacing.smd,
                crossAxisSpacing: AppSpacing.smd,
                childAspectRatio: 2.2,
                children: [
                  _buildQuickActionCard('AI শিক্ষক', Icons.smart_toy_rounded, AppColors.primary, () => context.go('/ai-tutor-chat')),
                  _buildQuickActionCard('প্র্যাকটিস', Icons.quiz_rounded, AppColors.secondary, () => context.go('/practice-setup')),
                  _buildQuickActionCard('হোমওয়ার্ক', Icons.camera_alt_rounded, AppColors.info, () => context.go('/homework-help')),
                  _buildQuickActionCard('পরীক্ষা', Icons.assignment_rounded, AppColors.warning, () => context.go('/exam-library')),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),

              // Subjects List
              AppSectionHeader(
                title: l10n.subjectsHeader,
                actionLabel: l10n.seeAll,
                onActionTap: () => context.go('/learn'),
              ),
              const SizedBox(height: AppSpacing.xs),
              SizedBox(
                height: 100,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildHorizontalSubjectCard('গণিত', '৮টি অধ্যায়', Icons.calculate_rounded, AppColors.primary),
                    _buildHorizontalSubjectCard('বিজ্ঞান', '৬টি অধ্যায়', Icons.science_rounded, AppColors.success),
                    _buildHorizontalSubjectCard('English', '১০টি পাঠ', Icons.translate_rounded, AppColors.secondary),
                    _buildHorizontalSubjectCard('বাংলা', '১২টি পাঠ', Icons.auto_stories_rounded, AppColors.warning),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textDisabled,
        backgroundColor: AppColors.surface,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        onTap: (index) {
          setState(() => _currentIndex = index);
          if (index == 1) context.go('/learn');
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

  Widget _buildMiniStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(height: 2),
        Text(value, style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        Text(label, style: AppTypography.caption.copyWith(fontSize: 10)),
      ],
    );
  }

  Widget _buildQuickActionCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.smd, vertical: AppSpacing.xs),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withAlpha(25),
              borderRadius: AppRadius.borderSm,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              title,
              style: AppTypography.cardTitle.copyWith(fontSize: 14),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalSubjectCard(String title, String subtitle, IconData icon, Color color) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: AppSpacing.smd),
      child: AppCard(
        onTap: () => context.go('/subject-details'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: AppSpacing.xs),
            Text(title, style: AppTypography.cardTitle.copyWith(fontSize: 14)),
            Text(subtitle, style: AppTypography.caption.copyWith(fontSize: 10)),
          ],
        ),
      ),
    );
  }
}
