import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class MathProgressDetailPage extends StatelessWidget {
  const MathProgressDetailPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final chapters = [
      ('অধ্যায় ১: প্যাটার্ন', 'সম্পন্ন', 1.0, Colors.green),
      ('অধ্যায় ২: মুনাফা', '৮৫% সম্পন্ন', 0.85, Colors.green),
      ('অধ্যায় ৩: পরিমাপ', '৭০% সম্পন্ন', 0.70, AppColors.primary),
      ('অধ্যায় ৪: সরল সমীকরণ', '৫৮% সম্পন্ন', 0.58, AppColors.primary),
      ('অধ্যায় ৫: বীজগণিতীয় সূত্রাবলি', '৪০% সম্পন্ন', 0.40, Colors.amber),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/student-progress-dashboard'),
        ),
        title: Text(
          l10n.mathProgressTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Overall Hero Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Text('৭৮%', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('গণিত বিষয় মাস্তারি', style: TextStyle(fontSize: 14, color: Colors.white70)),
                          SizedBox(height: 2),
                          Text('১২ ঘণ্টা ৪৫ মিনিট পড়া হয়েছে', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          SizedBox(height: 4),
                          Text('১০টির মধ্যে ৪টি অধ্যায় সম্পন্ন', style: TextStyle(fontSize: 12, color: Colors.white70)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Chapter Breakdown
              const Text(
                'অধ্যায়ভিত্তিক অগ্রগতি',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: AppSpacing.md),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: chapters.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final ch = chapters[index];
                  return Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(ch.$1, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            Text(ch.$2, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: ch.$4)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: ch.$3,
                            backgroundColor: AppColors.border,
                            valueColor: AlwaysStoppedAnimation<Color>(ch.$4),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: AppSpacing.xl),
              // Weakness Recommendation Diagnostic Box
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('দুর্বল বিষয় পাওয়া গেছে', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.red)),
                          SizedBox(height: 2),
                          Text('ভগ্নাংশের সমীকরণে তোমার মাস্তারি মাত্র ৩৫%। প্র্যাকটিস বাড়ানো প্রয়োজন।', style: TextStyle(fontSize: 12, color: AppColors.textPrimary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
