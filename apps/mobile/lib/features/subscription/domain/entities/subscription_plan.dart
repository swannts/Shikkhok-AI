class SubscriptionPlan {
  final String id;
  final String title;
  final String? description;
  final num priceBdt;
  final int durationDays;
  final List<String> features;
  final bool isPopular;

  const SubscriptionPlan({
    required this.id,
    required this.title,
    this.description,
    required this.priceBdt,
    this.durationDays = 30,
    this.features = const [],
    this.isPopular = false,
  });
}
