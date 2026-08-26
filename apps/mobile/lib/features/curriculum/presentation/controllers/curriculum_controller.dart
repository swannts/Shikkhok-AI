import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/errors/app_failure.dart';
import '../../domain/entities/subject.dart';
import '../../domain/entities/chapter.dart';
import '../../domain/entities/lesson.dart';
import '../../domain/entities/progress_summary.dart';
import '../../domain/repositories/curriculum_repository.dart';
import '../../data/datasources/curriculum_remote_data_source.dart';
import '../../data/repositories/curriculum_repository_impl.dart';

final curriculumRemoteDataSourceProvider =
    Provider<CurriculumRemoteDataSource>((ref) {
  return CurriculumRemoteDataSourceImpl(apiClient);
});

final curriculumRepositoryProvider = Provider<CurriculumRepository>((ref) {
  return CurriculumRepositoryImpl(
    ref.read(curriculumRemoteDataSourceProvider),
    apiClient,
  );
});

sealed class CurriculumState {
  const CurriculumState();
}

class CurriculumInitial extends CurriculumState {
  const CurriculumInitial();
}

class CurriculumLoading extends CurriculumState {
  const CurriculumLoading();
}

class CurriculumSubjectsLoaded extends CurriculumState {
  final List<Subject> subjects;
  const CurriculumSubjectsLoaded(this.subjects);
}

class CurriculumFailure extends CurriculumState {
  final AppFailure failure;
  const CurriculumFailure(this.failure);
}

class CurriculumController extends StateNotifier<CurriculumState> {
  final CurriculumRepository _repository;

  CurriculumController(this._repository) : super(const CurriculumInitial());

  Future<void> loadSubjects({
    required int classLevel,
    required String medium,
    int curriculumYear = 2026,
  }) async {
    state = const CurriculumLoading();
    try {
      final subjects = await _repository.listSubjects(
        classLevel: classLevel,
        medium: medium,
        curriculumYear: curriculumYear,
      );
      state = CurriculumSubjectsLoaded(subjects);
    } on AppFailure catch (e) {
      state = CurriculumFailure(e);
    } catch (e) {
      state = CurriculumFailure(
        ServerFailure(
          message: e.toString(),
          banglaMessage: 'বিষয় তালিকা আনা সম্ভব হয়নি।',
        ),
      );
    }
  }

  Future<List<Chapter>> loadChapters(String subjectId) async {
    return _repository.listChapters(subjectId);
  }

  Future<List<Lesson>> loadLessons(String chapterId) async {
    return _repository.listLessons(chapterId);
  }

  Future<Lesson> loadLesson(String lessonId) async {
    return _repository.getLesson(lessonId);
  }

  Future<ProgressSummary> loadProgressSummary() async {
    return _repository.getMyProgressSummary();
  }

  Future<void> markLessonComplete({
    required String lessonId,
    int? timeSpentSeconds,
  }) async {
    await _repository.updateLessonProgress(
      lessonId: lessonId,
      completed: true,
      timeSpentSeconds: timeSpentSeconds,
    );
  }
}

final curriculumControllerProvider =
    StateNotifierProvider<CurriculumController, CurriculumState>((ref) {
  return CurriculumController(ref.read(curriculumRepositoryProvider));
});

final progressSummaryFutureProvider = FutureProvider<ProgressSummary>((ref) {
  return ref.read(curriculumRepositoryProvider).getMyProgressSummary();
});

class SubjectDetailsViewData {
  final Subject subject;
  final List<Chapter> chapters;

  const SubjectDetailsViewData({
    required this.subject,
    required this.chapters,
  });
}

final subjectDetailsProvider =
    FutureProvider.family<SubjectDetailsViewData, String>(
        (ref, subjectId) async {
  final repo = ref.watch(curriculumRepositoryProvider);
  final subject = await repo.getSubject(subjectId);
  final chapters = await repo.listChapters(subjectId);
  return SubjectDetailsViewData(
    subject: subject,
    chapters: chapters,
  );
});

class ChapterDetailsViewData {
  final Chapter chapter;
  final Subject? subject;
  final List<Lesson> lessons;
  final int completedLessons;
  final int totalLessons;
  final double progressPercent;

  const ChapterDetailsViewData({
    required this.chapter,
    this.subject,
    required this.lessons,
    this.completedLessons = 0,
    this.totalLessons = 0,
    this.progressPercent = 0.0,
  });
}

final chapterDetailsProvider =
    FutureProvider.family<ChapterDetailsViewData, String>(
        (ref, chapterId) async {
  final repo = ref.watch(curriculumRepositoryProvider);
  final chapter = await repo.getChapter(chapterId);
  Subject? subject;
  try {
    subject = await repo.getSubject(chapter.subjectId);
  } catch (_) {}
  final lessons = await repo.listLessons(chapterId);

  int completedCount = 0;
  final totalCount = lessons.length;
  double progressPercentage = 0.0;

  try {
    final chapterProgressList =
        await repo.getMySubjectProgress(chapter.subjectId);
    final match = chapterProgressList
        .where((cp) => cp.chapterId == chapterId)
        .firstOrNull;
    if (match != null) {
      completedCount = match.completedLessons;
      progressPercentage = match.completionRate;
    }
  } catch (_) {}

  return ChapterDetailsViewData(
    chapter: chapter,
    subject: subject,
    lessons: lessons,
    completedLessons: completedCount,
    totalLessons: totalCount,
    progressPercent: progressPercentage,
  );
});

class LessonDetailsViewData {
  final Lesson lesson;
  final Chapter? chapter;
  final Subject? subject;

  const LessonDetailsViewData({
    required this.lesson,
    this.chapter,
    this.subject,
  });
}

final lessonDetailsProvider =
    FutureProvider.family<LessonDetailsViewData, String>((ref, lessonId) async {
  final repo = ref.watch(curriculumRepositoryProvider);
  final lesson = await repo.getLesson(lessonId);
  Chapter? chapter;
  Subject? subject;
  try {
    chapter = await repo.getChapter(lesson.chapterId);
    subject = await repo.getSubject(chapter.subjectId);
  } catch (_) {}
  return LessonDetailsViewData(
    lesson: lesson,
    chapter: chapter,
    subject: subject,
  );
});
