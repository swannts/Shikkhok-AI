import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/subscription_dto.dart';

abstract class SubscriptionRemoteDataSource {
  Future<List<SubscriptionPlanDto>> listPlans();

  Future<UserSubscriptionDto> getMySubscription();

  Future<String> initiatePayment({
    required String planId,
    required String paymentMethod,
  });

  Future<void> submitManualPayment({
    required String planId,
    required String method,
    required String walletNumber,
    required String transactionId,
  });
}

class SubscriptionRemoteDataSourceImpl implements SubscriptionRemoteDataSource {
  final ApiClient _apiClient;

  SubscriptionRemoteDataSourceImpl([ApiClient? client])
      : _apiClient = client ?? apiClient;

  @override
  Future<List<SubscriptionPlanDto>> listPlans() async {
    final response = await _apiClient.dio.get(ApiEndpoints.subscriptionPlans);
    final raw = response.data;
    final list = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as List<dynamic>
        : (raw is List<dynamic> ? raw : const []);

    return list
        .map((e) => SubscriptionPlanDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<UserSubscriptionDto> getMySubscription() async {
    final response = await _apiClient.dio.get(ApiEndpoints.subscriptionMy);
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return UserSubscriptionDto.fromJson(map);
  }

  @override
  Future<String> initiatePayment({
    required String planId,
    required String paymentMethod,
  }) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.subscriptionInitiate,
      data: {
        'planId': planId,
        'provider': paymentMethod,
      },
    );

    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return (map['gatewayUrl'] ?? map['redirectUrl'] ?? '').toString();
  }

  @override
  Future<void> submitManualPayment({
    required String planId,
    required String method,
    required String walletNumber,
    required String transactionId,
  }) async {
    await _apiClient.dio.post(
      ApiEndpoints.subscriptionManualSubmit,
      data: {
        'planId': planId,
        'method': method,
        'walletNumber': walletNumber,
        'transactionId': transactionId,
      },
    );
  }
}
