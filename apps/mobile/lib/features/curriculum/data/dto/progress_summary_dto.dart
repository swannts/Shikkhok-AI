class ProgressSummaryDto {
  final int totalLessonsCompleted;
  final int totalPracticeSessions;
  final double averageScore;
  final int streakDays;
  final int totalMinutesStudied;
  final Map<String, dynamic> subjectMastery;

  const ProgressSummaryDto({
    this.totalLessonsCompleted = 0,
    this.totalPracticeSessions = 0,
    this.averageScore = 0.0,
    this.streakDays = 0,
    this.totalMinutesStudied = 0,
    this.subjectMastery = const {},
  });

  factory ProgressSummaryDto.fromJson(Map<String, dynamic> json) {
    return ProgressSummaryDto(
      totalLessonsCompleted:
          (json['totalLessonsCompleted'] as num?)?.toInt() ?? 0,
      totalPracticeSessions:
          (json['totalPracticeSessions'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
      streakDays: (json['streakDays'] as num?)?.toInt() ?? 0,
      totalMinutesStudied: (json['totalMinutesStudied'] as num?)?.toInt() ?? 0,
      subjectMastery: json['subjectMastery'] is Map<String, dynamic>
          ? json['subjectMastery'] as Map<String, dynamic>
          : const {},
    );
  }

  Map<String, dynamic> toJson() => {
        'totalLessonsCompleted': totalLessonsCompleted,
        'totalPracticeSessions': totalPracticeSessions,
        'averageScore': averageScore,
        'streakDays': streakDays,
        'totalMinutesStudied': totalMinutesStudied,
        'subjectMastery': subjectMastery,
      };
}
