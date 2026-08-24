import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class StudyCalendarPage extends StatefulWidget {
  const StudyCalendarPage({super.key});

  @override
  State<StudyCalendarPage> createState() => _StudyCalendarPageState();
}

class _StudyCalendarPageState extends State<StudyCalendarPage> {
  int _selectedDay = 24;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final daysOfWeek = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.studyCalendarTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Calendar Header (Month Switcher)
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left_rounded, color: AppColors.textPrimary),
                          onPressed: () {},
                        ),
                        const Text(
                          'মে ২০২৬',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chevron_right_rounded, color: AppColors.textPrimary),
                          onPressed: () {},
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    // Days of week header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: daysOfWeek.map((day) {
                        return SizedBox(
                          width: 36,
                          child: Text(
                            day,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                            textAlign: TextAlign.center,
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    // Grid 1 to 31 mock days
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 7,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                      ),
                      itemCount: 31,
                      itemBuilder: (context, index) {
                        final dayNum = index + 1;
                        final isSelected = dayNum == _selectedDay;
                        final isCompleted = dayNum < 24 && dayNum % 2 == 0;

                        return InkWell(
                          onTap: () => setState(() => _selectedDay = dayNum),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary
                                  : (isCompleted ? Colors.green.shade100 : AppColors.background),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.border,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '$dayNum',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected
                                        ? Colors.white
                                        : (isCompleted ? Colors.green.shade900 : AppColors.textPrimary),
                                  ),
                                ),
                                if (isCompleted && !isSelected)
                                  const Icon(Icons.check_rounded, size: 10, color: Colors.green),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              // Today's Streak Summary Banner
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withAlpha(40)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_fire_department_rounded, color: Colors.deepOrange, size: 32),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('৭ দিন টানা পড়ালেখা!', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                          Text('ধারাবাহিকতা বজায় রাখতে আজ অন্তত ৩০ মিনিট পড়ুন।', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              // Tasks for selected day
              Text(
                '$_selectedDay মে-র নির্ধারিত পাঠ',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: AppSpacing.md),
              _buildTaskCard('সরল সমীকরণ প্র্যাকটিস', 'গণিত • ২০ মিনিট', true),
              const SizedBox(height: 10),
              _buildTaskCard('বিজ্ঞান মডেল টেস্ট ১', 'বিজ্ঞান • ১৫ মিনিট', false),
              const SizedBox(height: 10),
              _buildTaskCard('ইংরেজি ব্যাকরণ রিভিশন', 'English • ১০ মিনিট', false),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTaskCard(String title, String subtitle, bool isDone) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(
            isDone ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
            color: isDone ? Colors.green : AppColors.textSecondary,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    decoration: isDone ? TextDecoration.lineThrough : null,
                    color: isDone ? AppColors.textSecondary : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
