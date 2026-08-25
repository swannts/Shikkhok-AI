import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/subscription/data/datasources/subscription_remote_data_source.dart';
import 'package:mobile/features/subscription/data/dto/subscription_dto.dart';
import 'package:mobile/features/subscription/data/repositories/subscription_repository_impl.dart';

class MockSubscriptionRemoteDataSource implements SubscriptionRemoteDataSource {
  @override
  Future<List<SubscriptionPlanDto>> listPlans() async {
    return const [
      SubscriptionPlanDto(
        id: 'plan-pro',
        title: 'প্রো প্ল্যান',
        priceBdt: 499,
        durationDays: 30,
        features: ['সীমাহীন AI চ্যাট', 'মডেল টেস্ট'],
        isPopular: true,
      ),
    ];
  }

  @override
  Future<UserSubscriptionDto> getMySubscription() async {
    return const UserSubscriptionDto(
      status: 'active',
      planTitle: 'প্রো প্ল্যান',
      remainingDays: 24,
      hasActiveAccess: true,
    );
  }

  @override
  Future<String> initiatePayment({
    required String planId,
    required String paymentMethod,
  }) async {
    return 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=pay&token=xyz';
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

  group('SubscriptionRepositoryImpl Unit Tests', () {
    late SubscriptionRepositoryImpl repository;
    late MockSubscriptionRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockSubscriptionRemoteDataSource();
      apiClient = ApiClient();
      repository = SubscriptionRepositoryImpl(mockDataSource, apiClient);
    });

    test('listPlans returns mapped SubscriptionPlan entities', () async {
      final plans = await repository.listPlans();

      expect(plans.length, 1);
      expect(plans.first.title, 'প্রো প্ল্যান');
      expect(plans.first.priceBdt, 499);
      expect(plans.first.isPopular, isTrue);
    });

    test('getMySubscription returns mapped UserSubscription', () async {
      final sub = await repository.getMySubscription();

      expect(sub.isActive, isTrue);
      expect(sub.remainingDays, 24);
      expect(sub.planTitle, 'প্রো প্ল্যান');
    });

    test('initiatePayment returns gateway redirect URL', () async {
      final url = await repository.initiatePayment(
        planId: 'plan-pro',
        paymentMethod: 'bkash',
      );

      expect(url, contains('sandbox.sslcommerz.com'));
    });
  });
}
