import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class AiTutorHistoryPage extends StatefulWidget {
  const AiTutorHistoryPage({super.key});

  @override
  State<AiTutorHistoryPage> createState() => _AiTutorHistoryPageState();
}

class _AiTutorHistoryPageState extends State<AiTutorHistoryPage> {
  int _selectedFilterIndex = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final filters = [
      'সব',
      l10n.subjectMath,
      l10n.subjectScience,
      l10n.subjectEnglish,
      l10n.subjectBangla
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/ai-tutor-chat'),
        ),
        title: Text(
          l10n.chatHistoryTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded,
                color: AppColors.textSecondary),
            onPressed: () => context.go('/ai-tutor-history-empty'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Bar
              TextField(
                decoration: InputDecoration(
                  hintText: l10n.searchHistoryPlaceholder,
                  prefixIcon: const Icon(Icons.search_rounded,
                      color: AppColors.textSecondary),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16)),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              // Category Chips
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
                          color: isSelected
                              ? Colors.white
                              : AppColors.textSecondary,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
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
              // Today Section
              Text(
                l10n.today,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.sm),
              _buildHistoryCard(
                icon: Icons.calculate_rounded,
                title: 'সরল সমীকরণ কীভাবে সমাধান করবো?',
                meta: 'গণিত • 10:35 AM',
                bgColor: AppColors.primary.withAlpha(20),
                iconColor: AppColors.primary,
                onTap: () => context.go('/ai-tutor-chat'),
              ),
              const SizedBox(height: 10),
              _buildHistoryCard(
                icon: Icons.science_rounded,
                title: 'Photosynthesis সহজ করে বুঝাও',
                meta: 'বিজ্ঞান • 9:15 AM',
                bgColor: Colors.green.shade100,
                iconColor: Colors.green.shade800,
                onTap: () => context.go('/ai-tutor-chat'),
              ),
              const SizedBox(height: AppSpacing.lg),
              // Yesterday Section
              Text(
                l10n.yesterday,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.sm),
              _buildHistoryCard(
                icon: Icons.translate_rounded,
                title: 'Right form of verbs',
                meta: 'English • 4:20 PM',
                bgColor: Colors.amber.shade100,
                iconColor: Colors.amber.shade900,
                onTap: () => context.go('/ai-tutor-chat'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryCard({
    required IconData icon,
    required String title,
    required String meta,
    required Color bgColor,
    required Color iconColor,
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
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(meta,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
