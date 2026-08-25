class ParentChild {
  final String childUserId;
  final String name;
  final int classLevel;
  final String medium;
  final String? schoolName;
  final int streakDays;
  final int totalMinutesThisWeek;
  final double averageScore;

  const ParentChild({
    required this.childUserId,
    required this.name,
    required this.classLevel,
    this.medium = 'bangla',
    this.schoolName,
    this.streakDays = 0,
    this.totalMinutesThisWeek = 0,
    this.averageScore = 0,
  });
}
