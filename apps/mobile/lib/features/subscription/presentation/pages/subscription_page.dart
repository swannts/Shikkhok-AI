import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/subscription_controller.dart';
import '../../domain/entities/subscription_plan.dart';

class SubscriptionPage extends ConsumerStatefulWidget {
  const SubscriptionPage({super.key});

  @override
  ConsumerState<SubscriptionPage> createState() => _SubscriptionPageState();
}

class _SubscriptionPageState extends ConsumerState<SubscriptionPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(subscriptionControllerProvider) is SubscriptionInitial) {
        ref.read(subscriptionControllerProvider.notifier).loadPlansAndStatus();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(subscriptionControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
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
        child: _buildBody(state),
      ),
    );
  }

  Widget _buildBody(SubscriptionState state) {
    if (state is SubscriptionInitial || state is SubscriptionLoading) {
      return const Center(child: CircularProgressIndicator());
    } else if (state is SubscriptionError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(state.message, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(subscriptionControllerProvider.notifier).loadPlansAndStatus(),
              onPressed: () => ref
                  .read(subscriptionControllerProvider.notifier)
                  .loadPlansAndStatus(),
              child: const Text('আবার চেষ্টা করুন'),
            ),
          ],
        ),
      );
    } else if (state is SubscriptionLoaded) {
      if (state.plans.isEmpty) {
        return const Center(child: Text('কোন প্ল্যান পাওয়া যায়নি'));
      }
      return _buildContent(state);
    }
    return const SizedBox();
  }

  Widget _buildContent(SubscriptionLoaded state) {
    final defaultFeatures = [
      'আনলিমিটেড AI শিক্ষক চ্যাট ও ভয়েস প্রশ্ন',
      'ক্যামেরা দিয়ে আনলিমিটেড হোমওয়ার্ক সমাধান',
      'সকল মডেল টেস্ট ও বোর্ড পরীক্ষার এক্সেস',
      'অফলাইনে পড়াশোনার ডাউনলোড সুবিধা',
      'বিস্তারিত AI শিখন বিশ্লেষণ ও প্রোগ্রেস রিপোার্ট',
    ];

    final selectedPlan = state.selectedPlan ?? state.plans.first;
    final features = selectedPlan.features.isNotEmpty ? selectedPlan.features : defaultFeatures;
    final features = selectedPlan.features.isNotEmpty
        ? selectedPlan.features
        : defaultFeatures;

    return Column(
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
                      colors: [AppColors.primary, AppColors.primary.withAlpha(200)],
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
                      Icon(Icons.workspace_premium_rounded, color: Colors.amber, size: 48),
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
                          style: TextStyle(fontSize: 14, color: Colors.white70)),
                          style:
                              TextStyle(fontSize: 14, color: Colors.white70)),
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
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    return Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: Colors.amber, size: 20),
                        const Icon(Icons.check_circle_rounded,
                            color: Colors.amber, size: 20),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Text(features[index],
                              style: const TextStyle(
                                  fontSize: 14, color: AppColors.textPrimary)),
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
                ...state.plans.map((plan) {
                  final isSelected = plan.id == state.selectedPlanId;
                  final isYearly = plan.durationDays >= 365;
                  final monthlyEquivalent = isYearly ? plan.priceBdt / 12 : null;
                  final monthlyEquivalent =
                      isYearly ? plan.priceBdt / 12 : null;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () {
                        ref.read(subscriptionControllerProvider.notifier).selectPlan(plan.id);
                        ref
                            .read(subscriptionControllerProvider.notifier)
                            .selectPlan(plan.id);
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary.withAlpha(15) : AppColors.surface,
                          color: isSelected
                              ? AppColors.primary.withAlpha(15)
                              : AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.border,
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.border,
                            width: isSelected ? 2 : 1,
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
                                      Text(plan.title,
                                          style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary)),
                                      if (plan.isPopular) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.green,
                                            borderRadius: BorderRadius.circular(6),
                                            borderRadius:
                                                BorderRadius.circular(6),
                                          ),
                                          child: const Text('জনপ্রিয়',
                                              style: TextStyle(
                                                  fontSize: 10,
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ],
                                  ),
                                  if (monthlyEquivalent != null) ...[
                                    const SizedBox(height: 2),
                                    Text('৳${monthlyEquivalent.toStringAsFixed(0)} / মাস হিসাবে হিসাবকৃত',
                                    Text(
                                        '৳${monthlyEquivalent.toStringAsFixed(0)} / মাস হিসাবে হিসাবকৃত',
                                        style: const TextStyle(
                                            fontSize: 12, color: AppColors.textSecondary)),
                                            fontSize: 12,
                                            color: AppColors.textSecondary)),
                                  ],
                                ],
                              ),
                            ),
                            Text('৳${plan.priceBdt}',
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary)),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text(
                'সাবস্ক্রিপশন নিন',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
