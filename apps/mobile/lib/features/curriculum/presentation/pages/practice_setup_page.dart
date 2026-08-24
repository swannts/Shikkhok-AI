import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class PracticeSetupPage extends StatefulWidget {
  const PracticeSetupPage({super.key});

  @override
  State<PracticeSetupPage> createState() => _PracticeSetupPageState();
}

class _PracticeSetupPageState extends State<PracticeSetupPage> {
  String _selectedSubject = 'math';
  String _selectedChapter = 'ch4';
  int _selectedCount = 10;
  String _selectedDifficulty = 'adaptive';
  String _selectedType = 'mixed';
  bool _enableTimer = true;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/learn'),
        ),
        title: Text(
          l10n.practiceTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
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
                    // Subject Selector
                    Text(
                      l10n.subjectsHeader,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedSubject,
                          isExpanded: true,
                          items: const [
                            DropdownMenuItem(value: 'math', child: Text('গণিত')),
                            DropdownMenuItem(value: 'science', child: Text('বিজ্ঞান')),
                            DropdownMenuItem(value: 'english', child: Text('ইংরেজি')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedSubject = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Chapter Selector
                    Text(
                      l10n.chapterDetailsTitle,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedChapter,
                          isExpanded: true,
                          items: const [
                            DropdownMenuItem(value: 'ch4', child: Text('অধ্যায় ৪ • সরল সমীকরণ')),
                            DropdownMenuItem(value: 'ch5', child: Text('অধ্যায় ৫ • বীজগণিতীয় সূত্রাবলি ও প্রয়োগ')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedChapter = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Question Count Chips
                    Text(
                      l10n.questionCountLabel,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [5, 10, 15, 20].map((cnt) {
                        final isSelected = _selectedCount == cnt;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: InkWell(
                              onTap: () => setState(() => _selectedCount = cnt),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.primary.withAlpha(20) : AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected ? AppColors.primary : AppColors.border,
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Text(
                                  '$cnt',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Difficulty Selector
                    Text(
                      l10n.difficultyLabel,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildDifficultyChip('easy', 'সহজ'),
                        _buildDifficultyChip('medium', 'মাঝারি'),
                        _buildDifficultyChip('hard', 'কঠিন'),
                        _buildDifficultyChip('adaptive', 'Adaptive ✦', isSpecial: true),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Question Type
                    Text(
                      l10n.questionTypeLabel,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    _buildTypeTile('mcq', 'MCQ (বহুনির্বাচনী)'),
                    const SizedBox(height: 8),
                    _buildTypeTile('short', 'Short Answer (সংক্ষিপ্ত)'),
                    const SizedBox(height: 8),
                    _buildTypeTile('mixed', 'Mixed (মিশ্র)'),
                    const SizedBox(height: AppSpacing.lg),
                    // Timer Switch Toggle
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.timer_outlined, color: AppColors.primary),
                              SizedBox(width: 10),
                              Text('সময়সীমা (Timer)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            ],
                          ),
                          Switch(
                            value: _enableTimer,
                            activeTrackColor: AppColors.primary,
                            onChanged: (val) => setState(() => _enableTimer = val),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Start Action
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () => context.go('/lesson-reader'),
                  icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 24),
                  label: Text(
                    l10n.startPractice,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDifficultyChip(String key, String label, {bool isSpecial = false}) {
    final isSelected = _selectedDifficulty == key;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: isSpecial ? AppColors.primary : AppColors.primary.withAlpha(40),
      backgroundColor: AppColors.surface,
      labelStyle: TextStyle(
        color: isSelected ? (isSpecial ? Colors.white : AppColors.primary) : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (val) {
        if (val) setState(() => _selectedDifficulty = key);
      },
    );
  }

  Widget _buildTypeTile(String key, String label) {
    final isSelected = _selectedType == key;
    return InkWell(
      onTap: () => setState(() => _selectedType = key),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withAlpha(15) : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
