class ParentChildDto {
  final String childUserId;
  final String name;
  final int classLevel;
  final String medium;
  final String? schoolName;
  final int streakDays;
  final int totalMinutesThisWeek;
  final double averageScore;

  const ParentChildDto({
    required this.childUserId,
    required this.name,
    required this.classLevel,
    this.medium = 'bangla',
    this.schoolName,
    this.streakDays = 0,
    this.totalMinutesThisWeek = 0,
    this.averageScore = 0,
  });

  factory ParentChildDto.fromJson(Map<String, dynamic> json) {
    return ParentChildDto(
      childUserId: (json['childUserId'] ?? json['userId'] ?? json['_id'] ?? '')
          .toString(),
      name: (json['name'] ?? 'শিক্ষার্থী').toString(),
      classLevel: (json['classLevel'] as num?)?.toInt() ?? 8,
      medium: (json['medium'] ?? 'bangla').toString(),
      schoolName: json['schoolName']?.toString(),
      streakDays: (json['streakDays'] as num?)?.toInt() ?? 0,
      totalMinutesThisWeek:
          (json['totalMinutesThisWeek'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ParentChildSubjectProgressDto {
  final String subjectName;
  final double masteryPercentage;
  final int completedLessons;
  final int totalLessons;

  const ParentChildSubjectProgressDto({
    required this.subjectName,
    required this.masteryPercentage,
    this.completedLessons = 0,
    this.totalLessons = 0,
  });

  factory ParentChildSubjectProgressDto.fromJson(Map<String, dynamic> json) {
    return ParentChildSubjectProgressDto(
      subjectName: (json['subjectName'] ?? json['name'] ?? '').toString(),
      masteryPercentage: (json['masteryPercentage'] as num?)?.toDouble() ?? 0.0,
      completedLessons: (json['completedLessons'] as num?)?.toInt() ?? 0,
      totalLessons: (json['totalLessons'] as num?)?.toInt() ?? 0,
    );
  }
}

class ParentChildDashboardDto {
  final String childUserId;
  final String name;
  final int classLevel;
  final int streakDays;
  final int weeklyMinutes;
  final double averageAccuracy;
  final List<ParentChildSubjectProgressDto> subjects;
  final String? aiWeeklyInsightBangla;

  const ParentChildDashboardDto({
    required this.childUserId,
    required this.name,
    required this.classLevel,
    this.streakDays = 0,
    this.weeklyMinutes = 0,
    this.averageAccuracy = 0,
    this.subjects = const [],
    this.aiWeeklyInsightBangla,
  });

  factory ParentChildDashboardDto.fromJson(Map<String, dynamic> json) {
    return ParentChildDashboardDto(
      childUserId: (json['childUserId'] ?? '').toString(),
      name: (json['name'] ?? 'শিক্ষার্থী').toString(),
      classLevel: (json['classLevel'] as num?)?.toInt() ?? 8,
      streakDays: (json['streakDays'] as num?)?.toInt() ?? 0,
      weeklyMinutes: (json['weeklyMinutes'] as num?)?.toInt() ?? 0,
      averageAccuracy: (json['averageAccuracy'] as num?)?.toDouble() ?? 0.0,
      subjects: (json['subjects'] as List<dynamic>?)
              ?.map((e) => ParentChildSubjectProgressDto.fromJson(
                  e as Map<String, dynamic>))
              .toList() ??
          const [],
      aiWeeklyInsightBangla: json['aiWeeklyInsightBangla']?.toString(),
    );
  }
}
