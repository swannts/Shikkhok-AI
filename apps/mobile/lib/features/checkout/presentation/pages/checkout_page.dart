import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../subscription/presentation/controllers/subscription_controller.dart';

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key});

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  int _selectedPaymentMethod = 0; // 0: bKash, 1: Nagad, 2: Rocket, 3: Card

  final _paymentMethodsList = [
    (
      'bKash (বিকাশ)',
      Icons.account_balance_wallet_rounded,
      Colors.pink,
      'bkash'
    ),
    (
      'Nagad (নগদ)',
      Icons.account_balance_wallet_outlined,
      Colors.orange,
      'nagad'
    ),
    ('Rocket (রকেট)', Icons.mobile_friendly_rounded, Colors.purple, 'rocket'),
    (
      'Card / Net Banking',
      Icons.credit_card_rounded,
      AppColors.primary,
      'card'
    ),
  ];

  Future<void> _handlePayment() async {
    final state = ref.read(subscriptionControllerProvider);
    if (state is! SubscriptionLoaded) return;

    final methodKey = _paymentMethodsList[_selectedPaymentMethod].$4;

    final url = await ref
        .read(subscriptionControllerProvider.notifier)
        .initiatePayment(methodKey);

    if (url != null && mounted) {
      context.go(AppRoutes.paymentSuccess);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('পেমেন্ট শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(subscriptionControllerProvider);

    if (state is! SubscriptionLoaded) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.checkoutTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final plan = state.selectedPlan;
    if (plan == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.checkoutTitle)),
        body: const Center(child: Text('কোন প্ল্যান নির্বাচিত হয়নি')),
      );
    }

    final isProcessing = state.isProcessingPayment;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed:
              isProcessing ? null : () => context.go(AppRoutes.subscription),
        ),
        title: Text(
          l10n.checkoutTitle,
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
                    // Order Summary Card
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
                          const Text('অর্ডার বিবরণ',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary)),
                          const SizedBox(height: AppSpacing.sm),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(plan.title,
                                  style: const TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textSecondary)),
                              Text('৳${plan.priceBdt}',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textPrimary)),
                            ],
                          ),
                          const Divider(height: 20, color: AppColors.border),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('মোট প্রদেয়',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary)),
                              Text('৳${plan.priceBdt}',
                                  style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const Text('পেমেন্ট মাধ্যম নির্বাচন করুন',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: AppSpacing.md),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _paymentMethodsList.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final pm = _paymentMethodsList[index];
                        final isSelected = _selectedPaymentMethod == index;

                        return InkWell(
                          onTap: isProcessing
                              ? null
                              : () => setState(
                                  () => _selectedPaymentMethod = index),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary.withAlpha(15)
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(pm.$2, color: pm.$3, size: 24),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Text(pm.$1,
                                      style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary)),
                                ),
                                Icon(
                                  isSelected
                                      ? Icons.radio_button_checked_rounded
                                      : Icons.radio_button_off_rounded,
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.textSecondary,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
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
                  onPressed: isProcessing ? null : _handlePayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: isProcessing
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          'পেমেন্ট সম্পন্ন করুন (৳${plan.priceBdt})',
                          style: const TextStyle(
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
