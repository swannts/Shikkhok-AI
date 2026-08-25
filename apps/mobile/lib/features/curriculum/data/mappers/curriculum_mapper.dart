import '../../domain/entities/subject.dart';
import '../../domain/entities/chapter.dart';
import '../../domain/entities/lesson.dart';
import '../../domain/entities/progress_summary.dart';
import '../dto/subject_dto.dart';
import '../dto/chapter_dto.dart';
import '../dto/lesson_dto.dart';
import '../dto/progress_summary_dto.dart';

class CurriculumMapper {
  static Subject subjectToDomain(SubjectDto dto) {
    return Subject(
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      classLevel: dto.classLevel,
      medium: dto.medium,
      curriculumYear: dto.curriculumYear,
      description: dto.description,
      order: dto.order,
      isPublished: dto.isPublished,
    );
  }

  static Chapter chapterToDomain(ChapterDto dto) {
    return Chapter(
      id: dto.id,
      subjectId: dto.subjectId,
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      order: dto.order,
      estimatedMinutes: dto.estimatedMinutes,
      isPublished: dto.isPublished,
    );
  }

  static Lesson lessonToDomain(LessonDto dto) {
    return Lesson(
      id: dto.id,
      chapterId: dto.chapterId,
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      textbookReference: dto.textbookReference,
      order: dto.order,
      pageStart: dto.pageStart,
      pageEnd: dto.pageEnd,
      isPublished: dto.isPublished,
    );
  }

  static ProgressSummary progressSummaryToDomain(ProgressSummaryDto dto) {
    return ProgressSummary(
      totalLessonsCompleted: dto.totalLessonsCompleted,
      totalPracticeSessions: dto.totalPracticeSessions,
      averageScore: dto.averageScore,
      streakDays: dto.streakDays,
      totalMinutesStudied: dto.totalMinutesStudied,
      subjectMastery: dto.subjectMastery,
    );
  }
}
