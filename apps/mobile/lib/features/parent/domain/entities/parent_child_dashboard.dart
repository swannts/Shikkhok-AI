class ParentChildSubjectProgress {
  final String subjectName;
  final double masteryPercentage;
  final int completedLessons;
  final int totalLessons;

  const ParentChildSubjectProgress({
    required this.subjectName,
    required this.masteryPercentage,
    this.completedLessons = 0,
    this.totalLessons = 0,
  });
}

class ParentChildDashboard {
  final String childUserId;
  final String name;
  final int classLevel;
  final int streakDays;
  final int weeklyMinutes;
  final double averageAccuracy;
  final List<ParentChildSubjectProgress> subjects;
  final String? aiWeeklyInsightBangla;

  const ParentChildDashboard({
    required this.childUserId,
    required this.name,
    required this.classLevel,
    this.streakDays = 0,
    this.weeklyMinutes = 0,
    this.averageAccuracy = 0,
    this.subjects = const [],
    this.aiWeeklyInsightBangla,
  });
}
