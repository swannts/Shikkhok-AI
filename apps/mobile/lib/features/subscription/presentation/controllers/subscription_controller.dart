import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/subscription_plan.dart';
import '../../domain/entities/user_subscription.dart';
import '../../domain/repositories/subscription_repository.dart';
import '../../data/datasources/subscription_remote_data_source.dart';
import '../../data/repositories/subscription_repository_impl.dart';

final subscriptionRemoteDataSourceProvider =
    Provider<SubscriptionRemoteDataSource>((ref) {
  return SubscriptionRemoteDataSourceImpl(apiClient);
});

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  final remoteDataSource = ref.watch(subscriptionRemoteDataSourceProvider);
  return SubscriptionRepositoryImpl(remoteDataSource, apiClient);
});

sealed class SubscriptionState {
  const SubscriptionState();
}

class SubscriptionInitial extends SubscriptionState {
  const SubscriptionInitial();
}

class SubscriptionLoading extends SubscriptionState {
  const SubscriptionLoading();
}

class SubscriptionLoaded extends SubscriptionState {
  final List<SubscriptionPlan> plans;
  final UserSubscription mySubscription;
  final String? selectedPlanId;
  final bool isProcessingPayment;

  const SubscriptionLoaded({
    required this.plans,
    required this.mySubscription,
    this.selectedPlanId,
    this.isProcessingPayment = false,
  });

  SubscriptionPlan? get selectedPlan => plans.firstWhere(
        (p) => p.id == selectedPlanId,
        orElse: () => plans.first,
      );

  SubscriptionLoaded copyWith({
    List<SubscriptionPlan>? plans,
    UserSubscription? mySubscription,
    String? selectedPlanId,
    bool? isProcessingPayment,
  }) {
    return SubscriptionLoaded(
      plans: plans ?? this.plans,
      mySubscription: mySubscription ?? this.mySubscription,
      selectedPlanId: selectedPlanId ?? this.selectedPlanId,
      isProcessingPayment: isProcessingPayment ?? this.isProcessingPayment,
    );
  }
}

class SubscriptionError extends SubscriptionState {
  final String message;
  const SubscriptionError(this.message);
}

class SubscriptionController extends StateNotifier<SubscriptionState> {
  final SubscriptionRepository _repository;

  SubscriptionController(this._repository) : super(const SubscriptionInitial());

  Future<void> loadPlansAndStatus() async {
    state = const SubscriptionLoading();
    try {
      final plans = await _repository.listPlans();
      final mySubscription = await _repository.getMySubscription();

      final defaultPlanId = plans.isNotEmpty ? plans.first.id : null;

      state = SubscriptionLoaded(
        plans: plans,
        mySubscription: mySubscription,
        selectedPlanId: defaultPlanId,
      );
    } on AppFailure catch (failure) {
      state = SubscriptionError(failure.message);
    } catch (_) {
      state = const SubscriptionError('সাবস্ক্রিপশন প্ল্যান লোড করা যায়নি');
    }
  }

  void selectPlan(String planId) {
    final current = state;
    if (current is SubscriptionLoaded) {
      state = current.copyWith(selectedPlanId: planId);
    }
  }

  Future<String?> initiatePayment(String paymentMethod) async {
    final current = state;
    if (current is! SubscriptionLoaded || current.selectedPlanId == null) {
      return null;
    }

    state = current.copyWith(isProcessingPayment: true);
    try {
      final url = await _repository.initiatePayment(
        planId: current.selectedPlanId!,
        paymentMethod: paymentMethod,
      );
      state = current.copyWith(isProcessingPayment: false);
      return url;
    } on AppFailure {
      state = current.copyWith(isProcessingPayment: false);
      return null;
    } catch (_) {
      state = current.copyWith(isProcessingPayment: false);
      return null;
    }
  }

  Future<bool> submitManualPayment({
    required String method,
    required String walletNumber,
    required String transactionId,
  }) async {
    final current = state;
    if (current is! SubscriptionLoaded || current.selectedPlanId == null) {
      return false;
    }

    state = current.copyWith(isProcessingPayment: true);
    try {
      await _repository.submitManualPayment(
        planId: current.selectedPlanId!,
        method: method,
        walletNumber: walletNumber,
        transactionId: transactionId,
      );
      await loadPlansAndStatus();
      return true;
    } catch (_) {
      state = current.copyWith(isProcessingPayment: false);
      return false;
    }
  }
}

final subscriptionControllerProvider =
    StateNotifierProvider<SubscriptionController, SubscriptionState>((ref) {
  final repository = ref.watch(subscriptionRepositoryProvider);
  return SubscriptionController(repository);
});
