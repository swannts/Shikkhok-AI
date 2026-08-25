import '../entities/subscription_plan.dart';
import '../entities/user_subscription.dart';

abstract class SubscriptionRepository {
  Future<List<SubscriptionPlan>> listPlans();

  Future<UserSubscription> getMySubscription();

  Future<String> initiatePayment({
    required String planId,
    required String paymentMethod, // bkash, nagad, rocket, sslcommerz
  });

  Future<void> submitManualPayment({
    required String planId,
    required String method,
    required String walletNumber,
    required String transactionId,
  });
}
