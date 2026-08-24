import '../../domain/entities/study_plan.dart';
import '../../domain/entities/study_plan_item.dart';
import '../dto/study_plan_dto.dart';

class StudyPlanMapper {
  static StudyPlan toDomain(StudyPlanDto dto) {
    DateTime? parseDate(String? value) {
      if (value == null || value.isEmpty) {
        return null;
      }
      try {
        return DateTime.parse(value);
      } catch (_) {
        return null;
      }
    }

    return StudyPlan(
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      classLevel: dto.classLevel,
      medium: dto.medium,
      curriculumYear: dto.curriculumYear,
      weeklyTargetMinutes: dto.weeklyTargetMinutes,
      dailyTargetMinutes: dto.dailyTargetMinutes,
      focusSubjectIds: dto.focusSubjectIds,
      focusChapterIds: dto.focusChapterIds,
      focusLessonIds: dto.focusLessonIds,
      items: dto.items
          .map(
            (item) => StudyPlanItem(
              title: item.title,
              subjectId: item.subjectId,
              chapterId: item.chapterId,
              lessonId: item.lessonId,
              targetMinutes: item.targetMinutes,
              note: item.note,
              completed: item.completed,
            ),
          )
          .toList(),
      startsAt: parseDate(dto.startsAt),
      endsAt: parseDate(dto.endsAt),
      completedAt: parseDate(dto.completedAt),
      createdAt: parseDate(dto.createdAt),
      updatedAt: parseDate(dto.updatedAt),
    );
  }
}
