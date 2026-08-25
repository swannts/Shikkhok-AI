class SubscriptionPlanDto {
  final String id;
  final String title;
  final String? description;
  final num priceBdt;
  final int durationDays;
  final List<String> features;
  final bool isPopular;

  const SubscriptionPlanDto({
    required this.id,
    required this.title,
    this.description,
    required this.priceBdt,
    this.durationDays = 30,
    this.features = const [],
    this.isPopular = false,
  });

  factory SubscriptionPlanDto.fromJson(Map<String, dynamic> json) {
    return SubscriptionPlanDto(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? json['name'] ?? '').toString(),
      description: json['description']?.toString(),
      priceBdt: (json['priceBdt'] ?? json['price'] ?? 0) as num,
      durationDays: (json['durationDays'] as num?)?.toInt() ?? 30,
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      isPopular: (json['isPopular'] as bool?) ?? false,
    );
  }
}

class UserSubscriptionDto {
  final String status;
  final String? planTitle;
  final String? expiresAt;
  final int remainingDays;
  final bool hasActiveAccess;

  const UserSubscriptionDto({
    this.status = 'none',
    this.planTitle,
    this.expiresAt,
    this.remainingDays = 0,
    this.hasActiveAccess = false,
  });

  factory UserSubscriptionDto.fromJson(Map<String, dynamic> json) {
    return UserSubscriptionDto(
      status: (json['status'] ?? 'none').toString(),
      planTitle: json['planTitle']?.toString(),
      expiresAt: json['expiresAt']?.toString(),
      remainingDays: (json['remainingDays'] as num?)?.toInt() ?? 0,
      hasActiveAccess: (json['hasActiveAccess'] as bool?) ?? false,
    );
  }
}
