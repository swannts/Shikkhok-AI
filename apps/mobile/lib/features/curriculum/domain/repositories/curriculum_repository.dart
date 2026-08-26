import '../entities/subject.dart';
import '../entities/chapter.dart';
import '../entities/lesson.dart';
import '../entities/progress_summary.dart';
import '../entities/chapter_progress.dart';

abstract interface class CurriculumRepository {
  Future<List<Subject>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  });

  Future<Subject> getSubject(String subjectId);

  Future<List<Chapter>> listChapters(String subjectId);

  Future<Chapter> getChapter(String chapterId);

  Future<List<Lesson>> listLessons(String chapterId);

  Future<Lesson> getLesson(String lessonId);

  Future<ProgressSummary> getMyProgressSummary();

  Future<List<ChapterProgress>> getMySubjectProgress(String subjectId);

  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  });
}
