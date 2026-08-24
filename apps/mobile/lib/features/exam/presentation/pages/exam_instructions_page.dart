import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class ExamInstructionsPage extends StatefulWidget {
  const ExamInstructionsPage({super.key});

  @override
  State<ExamInstructionsPage> createState() => _ExamInstructionsPageState();
}

class _ExamInstructionsPageState extends State<ExamInstructionsPage> {
  bool _agreeToRules = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final rules = [
      'প্রতিটি প্রশ্নের সঠিক উত্তরের জন্য ১ নম্বর পাওয়া যাবে।',
      'কোনো নেগেটিভ মার্কিং থাকবে না।',
      'নির্দিষ্ট ৪০ মিনিটের মধ্যে সকল উত্তর জমা দিতে হবে।',
      'পরীক্ষা শুরু করার পর টাইমার থামানো যাবে না।',
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/exam-library'),
        ),
        title: Text(
          l10n.examInstructionsTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
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
                    // Exam Metadata Banner
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(20),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary.withAlpha(40)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.assignment_rounded, color: Colors.white, size: 28),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('গণিত মডেল টেস্ট ১', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                const SizedBox(height: 2),
                                Text('৩০টি প্রশ্ন • ৪০ মিনিট • ${l10n.totalMarks}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const Text(
                      'পরীক্ষার নিয়মাবলী',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // Rules List
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: rules.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        return Container(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Text('${index + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Text(
                                  rules[index],
                                  style: const TextStyle(fontSize: 14, height: 1.5, color: AppColors.textPrimary),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // Agreement Checkbox
                    InkWell(
                      onTap: () => setState(() => _agreeToRules = !_agreeToRules),
                      borderRadius: BorderRadius.circular(12),
                      child: Row(
                        children: [
                          Checkbox(
                            value: _agreeToRules,
                            activeColor: AppColors.primary,
                            onChanged: (val) => setState(() => _agreeToRules = val ?? false),
                          ),
                          Expanded(
                            child: Text(
                              l10n.agreeRules,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Start Exam Action
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
                  onPressed: _agreeToRules ? () => context.go('/exam-session') : null,
                  icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 24),
                  label: Text(
                    l10n.startExam,
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
}
