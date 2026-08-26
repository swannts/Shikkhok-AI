import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class SubscriptionPage extends StatefulWidget {
  const SubscriptionPage({super.key});

  @override
  State<SubscriptionPage> createState() => _SubscriptionPageState();
}

class _SubscriptionPageState extends State<SubscriptionPage> {
  int _selectedPlanIndex = 1; // 0: Monthly, 1: Yearly (Recommended)

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final features = [
      'আনলিমিটেড AI শিক্ষক চ্যাট ও ভয়েস প্রশ্ন',
      'ক্যামেরা দিয়ে আনলিমিটেড হোমওয়ার্ক সমাধান',
      'সকল মডেল টেস্ট ও বোর্ড পরীক্ষার এক্সেস',
      'অফলাইনে পড়াশোনার ডাউনলোড সুবিধা',
      'বিস্তারিত AI শিখন বিশ্লেষণ ও প্রোগ্রেস রিপোার্ট',
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go(AppRoutes.studentProfile),
        ),
        title: Text(
          l10n.subscriptionTitle,
          style: const TextStyle(
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
                    // Premium Hero Box
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.primary,
                            AppColors.primary.withAlpha(200)
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.workspace_premium_rounded,
                              color: Colors.amber, size: 48),
                          SizedBox(height: 8),
                          Text('Shikkhok Plus',
                              style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white)),
                          SizedBox(height: 4),
                          Text('তোমার পড়াশোনার সেরা সঙ্গী',
                              style: TextStyle(
                                  fontSize: 14, color: Colors.white70)),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const Text('প্লাসের সুবিধাসমূহ',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: AppSpacing.md),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: features.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        return Row(
                          children: [
                            const Icon(Icons.check_circle_rounded,
                                color: Colors.amber, size: 20),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Text(features[index],
                                  style: const TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textPrimary)),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const Text('প্যাক নির্বাচন করুন',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: AppSpacing.md),
                    // Monthly Plan
                    InkWell(
                      onTap: () => setState(() => _selectedPlanIndex = 0),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _selectedPlanIndex == 0
                                ? AppColors.primary
                                : AppColors.border,
                            width: _selectedPlanIndex == 0 ? 2 : 1,
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('মাসিক প্যাক',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary)),
                            Text('৳২৯৯ / মাস',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Yearly Plan (Recommended)
                    InkWell(
                      onTap: () => setState(() => _selectedPlanIndex = 1),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: _selectedPlanIndex == 1
                              ? AppColors.primary.withAlpha(15)
                              : AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _selectedPlanIndex == 1
                                ? AppColors.primary
                                : AppColors.border,
                            width: _selectedPlanIndex == 1 ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text('বার্ষিক প্যাক',
                                          style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary)),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.green,
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: const Text('৩০% ছাড়',
                                            style: TextStyle(
                                                fontSize: 10,
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  const Text('৳২০৮ / মাস হিসাবে হিসাবকৃত',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary)),
                                ],
                              ),
                            ),
                            const Text('৳২৪৯৯ / বছর',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary)),
                          ],
                        ),
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
                child: ElevatedButton(
                  onPressed: () => context.go(AppRoutes.checkout),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text(
                    'সাবস্ক্রিপশন নিন',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
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
