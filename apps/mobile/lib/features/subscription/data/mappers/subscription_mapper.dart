import '../../domain/entities/subscription_plan.dart';
import '../../domain/entities/user_subscription.dart';
import '../dto/subscription_dto.dart';

class SubscriptionMapper {
  static SubscriptionPlan toDomainPlan(SubscriptionPlanDto dto) {
    return SubscriptionPlan(
      id: dto.id,
      title: dto.title,
      description: dto.description,
      priceBdt: dto.priceBdt,
      durationDays: dto.durationDays,
      features: dto.features,
      isPopular: dto.isPopular,
    );
  }

  static UserSubscription toDomainSubscription(UserSubscriptionDto dto) {
    return UserSubscription(
      status: dto.status,
      planTitle: dto.planTitle,
      expiresAt:
          dto.expiresAt != null ? DateTime.tryParse(dto.expiresAt!) : null,
      remainingDays: dto.remainingDays,
      hasActiveAccess: dto.hasActiveAccess,
    );
  }
}
