import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/subscription_plan.dart';
import '../../domain/entities/user_subscription.dart';
import '../../domain/repositories/subscription_repository.dart';
import '../datasources/subscription_remote_data_source.dart';
import '../mappers/subscription_mapper.dart';

class SubscriptionRepositoryImpl implements SubscriptionRepository {
  final SubscriptionRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  SubscriptionRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<List<SubscriptionPlan>> listPlans() async {
    try {
      final dtos = await _remoteDataSource.listPlans();
      return dtos.map(SubscriptionMapper.toDomainPlan).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<UserSubscription> getMySubscription() async {
    try {
      final dto = await _remoteDataSource.getMySubscription();
      return SubscriptionMapper.toDomainSubscription(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<String> initiatePayment({
    required String planId,
    required String paymentMethod,
  }) async {
    try {
      return await _remoteDataSource.initiatePayment(
        planId: planId,
        paymentMethod: paymentMethod,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> submitManualPayment({
    required String planId,
    required String method,
    required String walletNumber,
    required String transactionId,
  }) async {
    try {
      await _remoteDataSource.submitManualPayment(
        planId: planId,
        method: method,
        walletNumber: walletNumber,
        transactionId: transactionId,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
