import '../../domain/entities/gamification_summary.dart';

class GamificationSummaryDto {
  final int streakDays;
  final int totalPoints;
  final String tierName;
  final int streakFreezeRemaining;
  final List<String> recentBadges;

  const GamificationSummaryDto({
    this.streakDays = 0,
    this.totalPoints = 0,
    this.tierName = 'Learner',
    this.streakFreezeRemaining = 1,
    this.recentBadges = const [],
  });

  factory GamificationSummaryDto.fromJson(Map<String, dynamic> json) {
    return GamificationSummaryDto(
      streakDays: (json['streakDays'] as num?)?.toInt() ??
          (json['currentStreak'] as num?)?.toInt() ??
          0,
      totalPoints: (json['totalPoints'] as num?)?.toInt() ??
          (json['points'] as num?)?.toInt() ??
          0,
      tierName: (json['tierName'] ?? json['tier'] ?? 'Learner').toString(),
      streakFreezeRemaining:
          (json['streakFreezeRemaining'] as num?)?.toInt() ?? 1,
      recentBadges: (json['recentBadges'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }

  GamificationSummary toDomain() {
    return GamificationSummary(
      streakDays: streakDays,
      totalPoints: totalPoints,
      tierName: tierName,
      streakFreezeRemaining: streakFreezeRemaining,
      recentBadges: recentBadges,
    );
  }
}
