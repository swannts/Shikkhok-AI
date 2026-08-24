import 'study_plan_item.dart';

class StudyPlan {
  final String id;
  final String title;
  final String? description;
  final String status;
  final int classLevel;
  final String medium;
  final int curriculumYear;
  final int weeklyTargetMinutes;
  final int dailyTargetMinutes;
  final List<String> focusSubjectIds;
  final List<String> focusChapterIds;
  final List<String> focusLessonIds;
  final List<StudyPlanItem> items;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final DateTime? completedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const StudyPlan({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.classLevel,
    required this.medium,
    required this.curriculumYear,
    required this.weeklyTargetMinutes,
    required this.dailyTargetMinutes,
    required this.focusSubjectIds,
    required this.focusChapterIds,
    required this.focusLessonIds,
    required this.items,
    required this.startsAt,
    required this.endsAt,
    required this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  int get completedMinutes =>
      items.where((item) => item.completed).fold<int>(0, (sum, item) => sum + item.targetMinutes);

  int get totalMinutes =>
      items.fold<int>(0, (sum, item) => sum + item.targetMinutes);

  double get progressValue {
    if (dailyTargetMinutes <= 0) {
      return items.isEmpty ? 0 : completedCount / items.length;
    }
    return (completedMinutes / dailyTargetMinutes).clamp(0.0, 1.0).toDouble();
  }

  int get completedCount => items.where((item) => item.completed).length;
}
