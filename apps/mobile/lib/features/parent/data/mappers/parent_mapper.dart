import '../../domain/entities/parent_child.dart';
import '../../domain/entities/parent_child_dashboard.dart';
import '../dto/parent_child_dto.dart';

class ParentMapper {
  static ParentChild toDomainChild(ParentChildDto dto) {
    return ParentChild(
      childUserId: dto.childUserId,
      name: dto.name,
      classLevel: dto.classLevel,
      medium: dto.medium,
      schoolName: dto.schoolName,
      streakDays: dto.streakDays,
      totalMinutesThisWeek: dto.totalMinutesThisWeek,
      averageScore: dto.averageScore,
    );
  }

  static ParentChildSubjectProgress toDomainSubject(
      ParentChildSubjectProgressDto dto) {
    return ParentChildSubjectProgress(
      subjectName: dto.subjectName,
      masteryPercentage: dto.masteryPercentage,
      completedLessons: dto.completedLessons,
      totalLessons: dto.totalLessons,
    );
  }

  static ParentChildDashboard toDomainDashboard(ParentChildDashboardDto dto) {
    return ParentChildDashboard(
      childUserId: dto.childUserId,
      name: dto.name,
      classLevel: dto.classLevel,
      streakDays: dto.streakDays,
      weeklyMinutes: dto.weeklyMinutes,
      averageAccuracy: dto.averageAccuracy,
      subjects: dto.subjects.map(toDomainSubject).toList(),
      aiWeeklyInsightBangla: dto.aiWeeklyInsightBangla,
    );
  }
}
