import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class GlobalSearchPage extends StatefulWidget {
  const GlobalSearchPage({super.key});

  @override
  State<GlobalSearchPage> createState() => _GlobalSearchPageState();
}

class _GlobalSearchPageState extends State<GlobalSearchPage> {
  final TextEditingController _searchController = TextEditingController();
  int _selectedFilterIndex = 0;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final filters = ['সব', 'অধ্যায়', 'ভিডিও', 'প্র্যাকটিস', 'নোট'];
    final recentSearches = ['সরল সমীকরণ', 'বীজগণিতীয় সূত্রাবলি', 'Photosynthesis', 'Right form of verbs'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: l10n.searchSubjectPlaceholder,
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, color: AppColors.textSecondary),
                    onPressed: () => setState(() => _searchController.clear()),
                  )
                : null,
          ),
          onChanged: (val) => setState(() {}),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Filter Chips
              SizedBox(
                height: 38,
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
              // Recent Searches Tag List
              Text(
                l10n.recentSearches,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xs),
              Wrap(
                spacing: 8,
                children: recentSearches.map((tag) {
                  return ActionChip(
                    avatar: const Icon(Icons.history_rounded, size: 16, color: AppColors.textSecondary),
                    label: Text(tag, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                    backgroundColor: AppColors.surface,
                    onPressed: () => setState(() => _searchController.text = tag),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Search Results List
              const Text(
                'ফলাফলসমূহ',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: AppSpacing.md),
              _buildSearchResultCard(
                icon: Icons.menu_book_rounded,
                title: 'সরল সমীকরণ',
                subtitle: 'গণিত • ৮ম শ্রেণি',
                tag: 'অধ্যায়',
                onTap: () => context.go('/lesson-reader'),
              ),
              const SizedBox(height: 10),
              _buildSearchResultCard(
                icon: Icons.assignment_rounded,
                title: 'বিজ্ঞান মডেল টেস্ট ১',
                subtitle: 'বিজ্ঞান • ১০ মিনিট',
                tag: 'পরীক্ষা',
                onTap: () => context.go('/exam-instructions'),
              ),
              const SizedBox(height: 10),
              _buildSearchResultCard(
                icon: Icons.smart_toy_rounded,
                title: '2x + 5 = 15 সমাধান কীভাবে?',
                subtitle: 'AI শিক্ষক উত্তর',
                tag: 'AI চ্যাট',
                onTap: () => context.go('/ai-tutor-chat'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchResultCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required String tag,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(tag, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }
}
