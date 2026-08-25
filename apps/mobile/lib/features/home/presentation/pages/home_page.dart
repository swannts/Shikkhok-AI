import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../auth/presentation/state/auth_state.dart';
import '../controllers/home_dashboard_controller.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authControllerProvider);
    final dashboardAsync = ref.watch(homeDashboardProvider);

    String studentName = 'শিক্ষার্থী';
    if (authState is Authenticated) {
      studentName = authState.user.name;
    }

    final initial = studentName.isNotEmpty ? studentName[0] : 'শ';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        title: Row(
          children: [
            AppAvatar(initials: initial, isOnline: true),
            const SizedBox(width: AppSpacing.smd),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.greetingMorning(studentName),
                    style: AppTypography.cardTitle),
                Text(l10n.greetingSubtitle, style: AppTypography.caption),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded,
                color: AppColors.textPrimary),
            onPressed: () => context.go('/notifications'),
          ),
          IconButton(
            icon:
                const Icon(Icons.search_rounded, color: AppColors.textPrimary),
            onPressed: () => context.go('/global-search'),
          ),
        ],
      ),
      body: dashboardAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (err, stack) => _buildDashboardBody(
          context,
          l10n,
          const HomeDashboardData(),
        ),
        data: (dashboard) => _buildDashboardBody(context, l10n, dashboard),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
          switch (index) {
            case 0:
              break;
            case 1:
              context.go('/learn');
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

  Widget _buildDashboardBody(
    BuildContext context,
    AppLocalizations l10n,
    HomeDashboardData dashboard,
  ) {
    final streak = dashboard.gamification.streakDays;
    final points = dashboard.gamification.totalPoints;
    final totalMinutes = dashboard.progress.totalMinutesStudied;
    final totalQuestions = dashboard.progress.totalPracticeSessions;
    final accuracy = (dashboard.progress.averageScore).round();

    return SafeArea(
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
                    children: [
                      const Text('আজকের অগ্রগতি',
                          style: AppTypography.cardTitle),
                      AppBadge(
                        label: '$streak দিন টানা 🔥',
                        variant: AppBadgeVariant.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.smd),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('মোট পয়েন্ট: $points XP',
                          style: AppTypography.caption),
                      Text('$totalMinutes / ৬০ মি',
                          style: AppTypography.caption),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs + 2),
                  AppProgressBar(
                    value: (totalMinutes / 60.0).clamp(0.0, 1.0),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMiniStat(
                          'পড়াশোনা', '$totalMinutes মি', Icons.timer_rounded),
                      _buildMiniStat(
                          'প্রশ্ন', '$totalQuestionsটি', Icons.quiz_rounded),
                      _buildMiniStat(
                          'সঠিকতা', '$accuracy%', Icons.check_circle_rounded),
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
                    child: const Icon(Icons.menu_book_rounded,
                        color: AppColors.primaryDark),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('সরল সমীকরণ সমাধান',
                            style: AppTypography.cardTitle),
                        SizedBox(height: 2),
                        Text('গণিত • অধ্যায় ৪ • ১৫ মিনিট',
                            style: AppTypography.caption),
                      ],
                    ),
                  ),
                  const Icon(Icons.play_circle_fill_rounded,
                      color: AppColors.primary, size: 32),
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
                _buildQuickActionCard('AI শিক্ষক', Icons.smart_toy_rounded,
                    AppColors.primary, () => context.go('/ai-tutor-chat')),
                _buildQuickActionCard('প্র্যাকটিস', Icons.quiz_rounded,
                    AppColors.secondary, () => context.go('/practice-setup')),
                _buildQuickActionCard('হোমওয়ার্ক', Icons.camera_alt_rounded,
                    AppColors.info, () => context.go('/homework-help-landing')),
                _buildQuickActionCard('পরীক্ষা', Icons.assignment_rounded,
                    AppColors.warning, () => context.go('/exam-library')),
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
            if (dashboard.subjects.isNotEmpty)
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: dashboard.subjects.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AppSpacing.smd),
                  itemBuilder: (context, index) {
                    final subject = dashboard.subjects[index];
                    return _buildSubjectChip(
                      subject.name,
                      Icons.menu_book_rounded,
                      AppColors.primaryLight,
                      () => context.go('/subject-details'),
                    );
                  },
                ),
              )
            else
              SizedBox(
                height: 100,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildSubjectChip(
                        l10n.subjectBangla,
                        Icons.menu_book_rounded,
                        const Color(0xFFFCE7F3),
                        () => context.go('/learn')),
                    const SizedBox(width: AppSpacing.smd),
                    _buildSubjectChip(
                        l10n.subjectEnglish,
                        Icons.translate_rounded,
                        const Color(0xFFFEF3C7),
                        () => context.go('/learn')),
                    const SizedBox(width: AppSpacing.smd),
                    _buildSubjectChip(l10n.subjectMath, Icons.calculate_rounded,
                        AppColors.primaryLight, () => context.go('/learn')),
                    const SizedBox(width: AppSpacing.smd),
                    _buildSubjectChip(
                        l10n.subjectScience,
                        Icons.science_rounded,
                        const Color(0xFFD1FAE5),
                        () => context.go('/learn')),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(height: AppSpacing.xs),
        Text(value, style: AppTypography.captionBold),
        Text(label, style: AppTypography.caption),
      ],
    );
  }

  Widget _buildQuickActionCard(
      String title, IconData icon, Color color, VoidCallback onTap) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xs + 2),
            decoration: BoxDecoration(
              color: color.withAlpha(25),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: AppSpacing.smd),
          Text(title, style: AppTypography.cardTitle),
        ],
      ),
    );
  }

  Widget _buildSubjectChip(
      String name, IconData icon, Color bgColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 84,
        padding: const EdgeInsets.symmetric(
            vertical: AppSpacing.smd, horizontal: AppSpacing.xs),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 28),
            const SizedBox(height: AppSpacing.xs),
            Text(
              name,
              style: AppTypography.captionBold,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
