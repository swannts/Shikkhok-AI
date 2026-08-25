import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/subscription/domain/entities/subscription_plan.dart';
import 'package:mobile/features/subscription/domain/entities/user_subscription.dart';
import 'package:mobile/features/subscription/domain/repositories/subscription_repository.dart';
import 'package:mobile/features/subscription/presentation/controllers/subscription_controller.dart';

class FakeSubscriptionRepository implements SubscriptionRepository {
  @override
  Future<List<SubscriptionPlan>> listPlans() async {
    return const [
      SubscriptionPlan(
        id: 'plan-pro',
        title: 'প্রো প্ল্যান',
        priceBdt: 499,
        durationDays: 30,
      ),
      SubscriptionPlan(
        id: 'plan-basic',
        title: 'বেসিক প্ল্যান',
        priceBdt: 299,
        durationDays: 30,
      ),
    ];
  }

  @override
  Future<UserSubscription> getMySubscription() async {
    return const UserSubscription(
      status: 'active',
      planTitle: 'প্রো প্ল্যান',
      remainingDays: 20,
      hasActiveAccess: true,
    );
  }

  @override
  Future<String> initiatePayment({
    required String planId,
    required String paymentMethod,
  }) async {
    return 'https://payment.example.com';
  }

  @override
  Future<void> submitManualPayment({
    required String planId,
    required String method,
    required String walletNumber,
    required String transactionId,
  }) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SubscriptionController Unit Tests', () {
    late SubscriptionController controller;
    late FakeSubscriptionRepository repository;

    setUp(() {
      repository = FakeSubscriptionRepository();
      controller = SubscriptionController(repository);
    });

    test('Initial state is SubscriptionInitial', () {
      expect(controller.state, isA<SubscriptionInitial>());
    });

    test('loadPlansAndStatus loads plans and sets active subscription',
        () async {
      await controller.loadPlansAndStatus();

      expect(controller.state, isA<SubscriptionLoaded>());
      final loaded = controller.state as SubscriptionLoaded;
      expect(loaded.plans.length, 2);
      expect(loaded.selectedPlanId, 'plan-pro');
      expect(loaded.mySubscription.isActive, isTrue);
    });

    test('selectPlan updates selectedPlanId', () async {
      await controller.loadPlansAndStatus();
      controller.selectPlan('plan-basic');

      final loaded = controller.state as SubscriptionLoaded;
      expect(loaded.selectedPlanId, 'plan-basic');
      expect(loaded.selectedPlan?.title, 'বেসিক প্ল্যান');
    });
  });
}
