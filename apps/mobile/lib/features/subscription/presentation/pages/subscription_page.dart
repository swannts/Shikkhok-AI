import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/router/app_routes.dart';
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
    final state = ref.watch(subscriptionControllerProvider);
    return Scaffold(
        appBar: AppBar(
            leading: IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => context.go(AppRoutes.studentProfile)),
            title: const Text('সাবস্ক্রিপশন')),
        body: _body(state));
  }

  Widget _body(SubscriptionState state) {
    if (state is SubscriptionInitial || state is SubscriptionLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state is SubscriptionError) {
      return Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(state.message, style: const TextStyle(color: Colors.red)),
        const SizedBox(height: AppSpacing.md),
        ElevatedButton(
            onPressed: () => ref
                .read(subscriptionControllerProvider.notifier)
                .loadPlansAndStatus(),
            child: const Text('আবার চেষ্টা করুন'))
      ]));
    }
    if (state is SubscriptionLoaded) {
      return _content(state);
    }
    return const SizedBox.shrink();
  }

  Widget _content(SubscriptionLoaded state) {
    if (state.plans.isEmpty) {
      return const Center(child: Text('কোনো প্ল্যান পাওয়া যায়নি'));
    }
    return ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
      const Text('তোমার জন্য সঠিক প্ল্যান বেছে নাও',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      const SizedBox(height: AppSpacing.lg),
      ...state.plans.map((plan) => _plan(plan, plan.id == state.selectedPlanId))
    ]);
  }

  Widget _plan(SubscriptionPlan plan, bool selected) => InkWell(
        onTap: () => ref
            .read(subscriptionControllerProvider.notifier)
            .selectPlan(plan.id),
        borderRadius: BorderRadius.circular(16),
        child: Container(
            margin: const EdgeInsets.only(bottom: AppSpacing.md),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
                color: selected ? AppColors.primaryLight : AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: selected ? AppColors.primary : AppColors.border,
                    width: selected ? 2 : 1)),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(plan.title,
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text('৳${plan.priceBdt} • ${plan.durationDays} দিন'),
              if (plan.description != null) Text(plan.description!),
              ...plan.features.map((feature) => Padding(
                  padding: const EdgeInsets.only(top: 5),
                  child: Text('✓ $feature')))
            ])),
      );
}
