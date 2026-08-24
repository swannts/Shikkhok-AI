class StudyPlanItemDto {
  final String title;
  final String? subjectId;
  final String? chapterId;
  final String? lessonId;
  final int targetMinutes;
  final String? note;
  final bool completed;

  const StudyPlanItemDto({
    required this.title,
    required this.subjectId,
    required this.chapterId,
    required this.lessonId,
    required this.targetMinutes,
    required this.note,
    required this.completed,
  });

  factory StudyPlanItemDto.fromJson(Map<String, dynamic> json) {
    return StudyPlanItemDto(
      title: (json['title'] ?? '').toString(),
      subjectId: json['subjectId']?.toString(),
      chapterId: json['chapterId']?.toString(),
      lessonId: json['lessonId']?.toString(),
      targetMinutes: (json['targetMinutes'] is num)
          ? (json['targetMinutes'] as num).toInt()
          : int.tryParse(json['targetMinutes']?.toString() ?? '') ?? 0,
      note: json['note']?.toString(),
      completed: json['completed'] == true,
    );
  }
}
