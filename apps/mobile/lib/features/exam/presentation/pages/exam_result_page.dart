import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class ExamResultPage extends StatelessWidget {
  const ExamResultPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/exam-library'),
        ),
        title: Text(
          l10n.examResultTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Celebration Badge
              Container(
                width: 90,
                height: 90,
                decoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text('A+', style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'অভিনন্দন! তুমি উত্তীর্ণ হয়েছো!',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.green),
              ),
              const SizedBox(height: 2),
              const Text(
                'গণিত মডেল টেস্ট ১ • ১ম স্থান',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Score Grid
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
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildExamStat('প্রাপ্ত নম্বর', '৪৫ / ৫০', Colors.green),
                        const VerticalDivider(width: 1, color: AppColors.border),
                        _buildExamStat('সঠিকতা', '৯০%', AppColors.primary),
                      ],
                    ),
                    const Divider(height: 24, color: AppColors.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildExamStat('ব্যয়িত সময়', '৩২মি ১০সে', AppColors.textPrimary),
                        const VerticalDivider(width: 1, color: AppColors.border),
                        _buildExamStat('পজিশন', '#১', Colors.amber.shade900),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              // Topic performance
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('বিষয়ভিত্তিক পারফরম্যান্স', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: AppSpacing.md),
                    _buildTopicRow('বীজগণিতীয় সূত্রাবলি', '১০/১০', 1.0, Colors.green),
                    const SizedBox(height: 10),
                    _buildTopicRow('সরল সমীকরণ', '৮/১০', 0.8, AppColors.primary),
                    const SizedBox(height: 10),
                    _buildTopicRow('ভগ্নাংশের সমীকরণ', '৭/১০', 0.7, Colors.amber),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Action Buttons
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () => context.go('/practice-mistake-review'),
                  icon: const Icon(Icons.assignment_outlined, color: Colors.white),
                  label: const Text(
                    'উত্তরপত্র ও সমাধান দেখুন',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () => context.go('/exam-library'),
                  icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
                  label: const Text(
                    'অন্য পরীক্ষা দিন',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.home_outlined, color: AppColors.textSecondary),
                label: Text(l10n.backToHome, style: const TextStyle(color: AppColors.textSecondary)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExamStat(String title, String val, Color color) {
    return Column(
      children: [
        Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Widget _buildTopicRow(String topic, String score, double progress, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(topic, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
            Text(score, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
