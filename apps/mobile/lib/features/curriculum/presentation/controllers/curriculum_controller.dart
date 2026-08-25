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
