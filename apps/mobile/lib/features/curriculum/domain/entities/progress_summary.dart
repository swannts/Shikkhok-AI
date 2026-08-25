class ProgressSummary {
  final int totalLessonsCompleted;
  final int totalPracticeSessions;
  final double averageScore;
  final int streakDays;
  final int totalMinutesStudied;
  final Map<String, dynamic> subjectMastery;

  const ProgressSummary({
    this.totalLessonsCompleted = 0,
    this.totalPracticeSessions = 0,
    this.averageScore = 0.0,
    this.streakDays = 0,
    this.totalMinutesStudied = 0,
    this.subjectMastery = const {},
  });
}
