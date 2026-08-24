import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class SourceCitationPage extends StatelessWidget {
  const SourceCitationPage({super.key});

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
          onPressed: () => context.go('/ai-tutor-chat'),
        ),
        title: Text(
          l10n.sourceCitationTitle,
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
                    // Source metadata card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(15),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primary.withAlpha(30)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.verified_rounded, color: AppColors.primary, size: 24),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'NCTB বোর্ড অনুমোদিত পাঠ্যবই থেকে যাচাইকৃত',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const Text('উৎস রেফারেন্স', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    const Text('জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) • গণিত, ৮ম শ্রেণি', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    const SizedBox(height: AppSpacing.lg),
                    // Textbook Page Excerpt Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              Text('অধ্যায় ৪: সরল সমীকরণ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              Text('পৃষ্ঠা ৫৮, অনুচ্ছেদ ৪.২', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            ],
                          ),
                          const Divider(height: 20, color: AppColors.border),
                          const Text(
                            '"সমীকরণ বলতে এমন একটি গাণিতিক বাক্যকে বোঝায় যাতে একটি সমান চিহ্ন (=) এবং এক বা একাধিক অজ্ঞাত রাশি (চলক) থাকে। চলকের একঘাত বিশিষ্ট সমীকরণকে সরল সমীকরণ বলা হয়। যেমন: ২x + ১ = ৯।"',
                            style: TextStyle(fontSize: 15, height: 1.6, fontStyle: FontStyle.italic, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Sticky CTA Action
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
                  onPressed: () => context.go('/textbook-reader'),
                  icon: const Icon(Icons.menu_book_rounded, color: Colors.white, size: 22),
                  label: const Text(
                    'পাঠ্যবই রিডারে দেখুন',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
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
