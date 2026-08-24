import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class LearnPage extends StatefulWidget {
  const LearnPage({super.key});

  @override
  State<LearnPage> createState() => _LearnPageState();
}

class _LearnPageState extends State<LearnPage> {
  int _selectedFilterIndex = 0;
  int _currentNavIndex = 1; // Learn active

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
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.learnHeader,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              '৮ম শ্রেণি • NCTB ২০২৬',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
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
              // Search Input Box
              TextField(
                decoration: InputDecoration(
                  hintText: l10n.searchSubjectPlaceholder,
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textSecondary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              // Category Filter Pills
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  itemBuilder: (context, index) {
                    final isSelected = _selectedFilterIndex == index;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(filters[index]),
                        selected: isSelected,
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
              // Subjects Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                childAspectRatio: 0.88,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  _buildSubjectCard(
                    title: l10n.subjectMath,
                    subtitle: 'Mathematics',
                    icon: Icons.calculate_rounded,
                    bgColor: AppColors.primary.withAlpha(20),
                    iconColor: AppColors.primary,
                    chapters: 12,
                    lessons: 48,
                    progress: 0.62,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectScience,
                    subtitle: 'Science',
                    icon: Icons.science_rounded,
                    bgColor: Colors.green.shade100,
                    iconColor: Colors.green.shade800,
                    chapters: 14,
                    lessons: 52,
                    progress: 0.48,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectBangla,
                    subtitle: 'Bangla',
                    icon: Icons.menu_book_rounded,
                    bgColor: Colors.pink.shade100,
                    iconColor: Colors.pink.shade800,
                    chapters: 10,
                    lessons: 40,
                    progress: 0.75,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectEnglish,
                    subtitle: 'English',
                    icon: Icons.language_rounded,
                    bgColor: Colors.amber.shade100,
                    iconColor: Colors.amber.shade900,
                    chapters: 15,
                    lessons: 60,
                    progress: 0.30,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectIct,
                    subtitle: 'Information Tech',
                    icon: Icons.computer_rounded,
                    bgColor: Colors.indigo.shade100,
                    iconColor: Colors.indigo.shade800,
                    chapters: 8,
                    lessons: 32,
                    progress: 0.90,
                  ),
                  _buildSubjectCard(
                    title: l10n.subjectSocial,
                    subtitle: 'Social Science',
                    icon: Icons.public_rounded,
                    bgColor: Colors.purple.shade100,
                    iconColor: Colors.purple.shade800,
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
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() => _currentNavIndex = index);
          if (index == 0) context.go('/');
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.book_rounded), label: 'Learn'),
          BottomNavigationBarItem(icon: Icon(Icons.edit_note_rounded), label: 'Practice'),
          BottomNavigationBarItem(icon: Icon(Icons.smart_toy_rounded), label: 'AI Tutor'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
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
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const Spacer(),
          Text(
            '$chapters অধ্যায় • $lessons পাঠ',
            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppColors.border,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                    minHeight: 5,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${(progress * 100).toInt()}%',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
