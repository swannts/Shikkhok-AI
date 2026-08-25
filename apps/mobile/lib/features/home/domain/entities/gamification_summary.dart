class GamificationSummary {
  final int streakDays;
  final int totalPoints;
  final String tierName;
  final int streakFreezeRemaining;
  final List<String> recentBadges;

  const GamificationSummary({
    this.streakDays = 0,
    this.totalPoints = 0,
    this.tierName = 'Learner',
    this.streakFreezeRemaining = 1,
    this.recentBadges = const [],
  });
}
