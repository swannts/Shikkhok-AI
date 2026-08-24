import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class StudentAchievementsPage extends StatelessWidget {
  const StudentAchievementsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final badges = [
      (
        '৭ দিন টানা রেকর্ড',
        'ধারাবাহিক ৭ দিন পড়াশোনা সম্পন্ন',
        Icons.local_fire_department_rounded,
        Colors.deepOrange,
        true
      ),
      (
        'দ্রুত উত্তরদাতা',
        '১০টি প্রশ্নের দ্রুত সঠিক উত্তর',
        Icons.bolt_rounded,
        Colors.amber,
        true
      ),
      (
        'শতভাগ সঠিকতা',
        'মডেল টেস্টে ৫০/৫০ প্রাপ্তি',
        Icons.verified_rounded,
        Colors.green,
        true
      ),
      (
        'পাঠ্যবই গবেষক',
        '৫টি NCTB পাঠ্যবই সম্পন্ন',
        Icons.menu_book_rounded,
        AppColors.primary,
        true
      ),
      (
        'মডেল টেস্ট চ্যাম্পিয়ন',
        'মডেল টেস্টে ১ম স্থান',
        Icons.emoji_events_rounded,
        Colors.purple,
        false
      ),
      (
        'AI শিক্ষক বন্ধু',
        '৫০টির বেশি AI প্রশ্ন সম্পন্ন',
        Icons.smart_toy_rounded,
        Colors.blue,
        true
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/profile'),
        ),
        title: Text(
          l10n.achievementsTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Level & XP Hero Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Level 5: সমীকরণ বিজয়ী',
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white)),
                        Text('২৪৫০ XP',
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    const Text('Level 6 পেতে আরও ৫৫০ XP প্রয়োজন',
                        style: TextStyle(fontSize: 12, color: Colors.white70)),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: const LinearProgressIndicator(
                        value: 0.81,
                        backgroundColor: Colors.white24,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.amber),
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              const Text('ব্যাজ ও খেতাবসমূহ',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary)),
              const SizedBox(height: AppSpacing.md),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.0,
                ),
                itemCount: badges.length,
                itemBuilder: (context, index) {
                  final b = badges[index];
                  return Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: b.$5 ? AppColors.surface : AppColors.background,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: b.$5
                              ? AppColors.border
                              : AppColors.border.withAlpha(50)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: b.$5
                                ? b.$4.withAlpha(20)
                                : Colors.grey.shade200,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(b.$3,
                              color: b.$5 ? b.$4 : Colors.grey, size: 28),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          b.$1,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: b.$5
                                ? AppColors.textPrimary
                                : AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          b.$2,
                          style: const TextStyle(
                              fontSize: 10, color: AppColors.textSecondary),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
