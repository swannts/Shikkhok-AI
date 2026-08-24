import 'study_plan_item_dto.dart';

class StudyPlanDto {
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
  final List<StudyPlanItemDto> items;
  final String? startsAt;
  final String? endsAt;
  final String? completedAt;
  final String? createdAt;
  final String? updatedAt;

  const StudyPlanDto({
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

  factory StudyPlanDto.fromJson(Map<String, dynamic> json) {
    List<String> parseStringList(dynamic value) {
      return (value as List<dynamic>? ?? const [])
          .map((entry) => entry.toString())
          .toList();
    }

    return StudyPlanDto(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      status: (json['status'] ?? 'active').toString(),
      classLevel: (json['classLevel'] is num)
          ? (json['classLevel'] as num).toInt()
          : int.tryParse(json['classLevel']?.toString() ?? '') ?? 0,
      medium: (json['medium'] ?? '').toString(),
      curriculumYear: (json['curriculumYear'] is num)
          ? (json['curriculumYear'] as num).toInt()
          : int.tryParse(json['curriculumYear']?.toString() ?? '') ?? 0,
      weeklyTargetMinutes: (json['weeklyTargetMinutes'] is num)
          ? (json['weeklyTargetMinutes'] as num).toInt()
          : int.tryParse(json['weeklyTargetMinutes']?.toString() ?? '') ?? 0,
      dailyTargetMinutes: (json['dailyTargetMinutes'] is num)
          ? (json['dailyTargetMinutes'] as num).toInt()
          : int.tryParse(json['dailyTargetMinutes']?.toString() ?? '') ?? 0,
      focusSubjectIds: parseStringList(json['focusSubjectIds']),
      focusChapterIds: parseStringList(json['focusChapterIds']),
      focusLessonIds: parseStringList(json['focusLessonIds']),
      items: (json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StudyPlanItemDto.fromJson)
          .toList(),
      startsAt: json['startsAt']?.toString(),
      endsAt: json['endsAt']?.toString(),
      completedAt: json['completedAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}
