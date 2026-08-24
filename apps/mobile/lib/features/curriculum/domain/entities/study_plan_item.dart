class StudyPlanItem {
  final String title;
  final String? subjectId;
  final String? chapterId;
  final String? lessonId;
  final int targetMinutes;
  final String? note;
  final bool completed;

  const StudyPlanItem({
    required this.title,
    required this.subjectId,
    required this.chapterId,
    required this.lessonId,
    required this.targetMinutes,
    required this.note,
    required this.completed,
  });
}
