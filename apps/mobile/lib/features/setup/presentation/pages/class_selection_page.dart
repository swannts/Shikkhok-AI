import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../profile/presentation/controllers/student_profile_controller.dart';

class ClassSelectionPage extends ConsumerStatefulWidget {
  const ClassSelectionPage({super.key});

  @override
  ConsumerState<ClassSelectionPage> createState() => _ClassSelectionPageState();
}

class _ClassSelectionPageState extends ConsumerState<ClassSelectionPage> {
  int? _selectedClassIndex = 7; // Default 8th class (index 7)
  String? _selectedGroup;

  final List<String> _classList = [
    '১ম শ্রেণি',
    '২য় শ্রেণি',
    '৩য় শ্রেণি',
    '৪র্থ শ্রেণি',
    '৫ম শ্রেণি',
    '৬ষ্ঠ শ্রেণি',
    '৭ম শ্রেণি',
    '৮ম শ্রেণি',
    '৯ম শ্রেণি',
    '১০ম শ্রেণি',
    'একাদশ',
    'দ্বাদশ'
  ];

  bool get _requiresGroup =>
      _selectedClassIndex != null && _selectedClassIndex! >= 8;

  bool get _canProceed =>
      _selectedClassIndex != null &&
      (!_requiresGroup || _selectedGroup != null);

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
          onPressed: () => context.go('/role-selection'),
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
                    // Step Progress Indicator
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(l10n.stepProgress('১'),
                            style: const TextStyle(
                                fontSize: 14, color: AppColors.textSecondary)),
                        const Text('33%',
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
                        value: 0.33,
                        backgroundColor: AppColors.border,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.primary),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Headings
                    Text(
                      l10n.selectClassTitle,
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      l10n.selectClassSubtitle,
                      style: const TextStyle(
                          fontSize: 15, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // 12-Class Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: AppSpacing.md,
                        mainAxisSpacing: AppSpacing.md,
                        childAspectRatio: 1.1,
                      ),
                      itemCount: _classList.length,
                      itemBuilder: (context, index) {
                        final isSelected = _selectedClassIndex == index;
                        final classNumber = index + 1;

                        return InkWell(
                          onTap: () {
                            setState(() {
                              _selectedClassIndex = index;
                              if (index < 8) {
                                _selectedGroup = null;
                              }
                            });
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary.withAlpha(20)
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: isSelected ? 2 : 1,
                              ),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: AppColors.primary.withAlpha(30),
                                        blurRadius: 8,
                                        offset: const Offset(0, 4),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.surfaceMuted,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '$classNumber',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected
                                            ? Colors.white
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.xs),
                                Text(
                                  _classList[index],
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.w500,
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                    // Academic Stream Selection for Class 9-12
                    if (_requiresGroup) ...[
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        l10n.selectGroupTitle,
                        style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _buildGroupChip('science', Icons.biotech_rounded,
                          l10n.groupScience, const Color(0xFF00A76F)),
                      const SizedBox(height: AppSpacing.sm),
                      _buildGroupChip('business', Icons.trending_up_rounded,
                          l10n.groupBusiness, const Color(0xFF00B8D9)),
                      const SizedBox(height: AppSpacing.sm),
                      _buildGroupChip('humanities', Icons.menu_book_rounded,
                          l10n.groupHumanities, const Color(0xFFFFAB00)),
                    ],
                  ],
                ),
              ),
            ),

            // Fixed Bottom CTA
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: const Border(top: BorderSide(color: AppColors.border)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(8),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _canProceed
                      ? () {
                          final classLevel = (_selectedClassIndex ?? 7) + 1;
                          ref
                              .read(studentProfileControllerProvider.notifier)
                              .setDraftClass(classLevel);
                          context.go('/curriculum-selection');
                        }
                      : null,
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

  Widget _buildGroupChip(
      String groupKey, IconData icon, String label, Color accentColor) {
    final isSelected = _selectedGroup == groupKey;

    return InkWell(
      onTap: () => setState(() => _selectedGroup = groupKey),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 60,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        decoration: BoxDecoration(
          color:
              isSelected ? AppColors.primary.withAlpha(20) : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: accentColor.withAlpha(30),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: accentColor),
            ),
            const SizedBox(width: AppSpacing.md),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(Icons.check_circle_rounded,
                  color: AppColors.primary, size: 22),
          ],
        ),
      ),
    );
  }
}
