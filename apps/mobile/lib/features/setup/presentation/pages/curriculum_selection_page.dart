import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../profile/domain/entities/student_profile.dart';
import '../../../profile/presentation/controllers/student_profile_controller.dart';

class CurriculumSelectionPage extends ConsumerStatefulWidget {
  const CurriculumSelectionPage({super.key});

  @override
  ConsumerState<CurriculumSelectionPage> createState() =>
      _CurriculumSelectionPageState();
}

class _CurriculumSelectionPageState
    extends ConsumerState<CurriculumSelectionPage> {
  StudentMediumType _selectedMedium = StudentMediumType.bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/class-selection'),
        ),
        title: const Text(
          'Shikkhok-AI',
          style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Step Progress
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(l10n.stepProgress('২'),
                            style: const TextStyle(
                                fontSize: 14, color: AppColors.textSecondary)),
                        const Text('66%',
                            style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: const LinearProgressIndicator(
                        value: 0.66,
                        backgroundColor: AppColors.border,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.primary),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Headings
                    Text(
                      l10n.selectCurriculumTitle,
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    const Text(
                      'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) অনুমোদিত',
                      style: TextStyle(
                          fontSize: 15, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Medium Selector
                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            label: const Center(child: Text('বাংলা ভার্সন')),
                            selected:
                                _selectedMedium == StudentMediumType.bangla,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() =>
                                    _selectedMedium = StudentMediumType.bangla);
                              }
                            },
                            selectedColor: AppColors.primary.withAlpha(30),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: ChoiceChip(
                            label: const Center(child: Text('English Version')),
                            selected:
                                _selectedMedium == StudentMediumType.english,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() => _selectedMedium =
                                    StudentMediumType.english);
                              }
                            },
                            selectedColor: AppColors.primary.withAlpha(30),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Curriculum Featured Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withAlpha(20),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withAlpha(20),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.school_rounded,
                                    color: AppColors.primary),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      l10n.nctbTitle,
                                      style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary),
                                    ),
                                    Text(
                                      l10n.nctbSubtitle,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.verified_rounded,
                                  color: AppColors.primary, size: 24),
                            ],
                          ),
                          const Divider(height: 24, color: AppColors.divider),
                          Row(
                            children: [
                              const Icon(Icons.calendar_today_outlined,
                                  size: 16, color: AppColors.textSecondary),
                              const SizedBox(width: 6),
                              Text(
                                l10n.academicYear,
                                style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),

                    // Subjects Preview Grid
                    Text(
                      l10n.curriculumSubjects,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: AppSpacing.sm,
                      crossAxisSpacing: AppSpacing.sm,
                      childAspectRatio: 2.6,
                      children: [
                        _buildSubjectChip(
                            Icons.menu_book_rounded,
                            l10n.subjectBangla,
                            Colors.pink.shade100,
                            Colors.pink.shade700),
                        _buildSubjectChip(
                            Icons.translate_rounded,
                            l10n.subjectEnglish,
                            Colors.amber.shade100,
                            Colors.amber.shade800),
                        _buildSubjectChip(
                            Icons.calculate_rounded,
                            l10n.subjectMath,
                            AppColors.primary.withAlpha(30),
                            AppColors.primary),
                        _buildSubjectChip(
                            Icons.science_rounded,
                            l10n.subjectScience,
                            Colors.green.shade100,
                            Colors.green.shade700),
                        _buildSubjectChip(
                            Icons.computer_rounded,
                            l10n.subjectIct,
                            Colors.indigo.shade100,
                            Colors.indigo.shade700),
                        _buildSubjectChip(
                            Icons.public_rounded,
                            l10n.subjectSocial,
                            Colors.purple.shade100,
                            Colors.purple.shade700),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Next CTA
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    ref
                        .read(studentProfileControllerProvider.notifier)
                        .setDraftCurriculum(
                          medium: _selectedMedium,
                          year: 2026,
                        );
                    context.go('/goal-setting');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        l10n.next,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_rounded,
                          size: 20, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectChip(
      IconData icon, String label, Color bgColor, Color iconColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: iconColor),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
