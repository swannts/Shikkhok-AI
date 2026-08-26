import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/network/api_response_envelope.dart';
import '../dto/subject_dto.dart';
import '../dto/chapter_dto.dart';
import '../dto/lesson_dto.dart';
import '../dto/progress_summary_dto.dart';
import '../dto/chapter_progress_dto.dart';

abstract interface class CurriculumRemoteDataSource {
  Future<List<SubjectDto>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  });

  Future<SubjectDto> getSubject(String subjectId);

  Future<List<ChapterDto>> listChapters(String subjectId);

  Future<ChapterDto> getChapter(String chapterId);

  Future<List<LessonDto>> listLessons(String chapterId);

  Future<LessonDto> getLesson(String lessonId);

  Future<ProgressSummaryDto> getMyProgressSummary();

  Future<List<ChapterProgressDto>> getMySubjectProgress(String subjectId);

  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  });
}

class CurriculumRemoteDataSourceImpl implements CurriculumRemoteDataSource {
  final ApiClient _client;

  CurriculumRemoteDataSourceImpl(this._client);

  @override
  Future<List<SubjectDto>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  }) async {
    final res = await _client.dio.get(
      ApiEndpoints.curriculumSubjects,
      queryParameters: {
        'classLevel': classLevel,
        'medium': medium,
        'curriculumYear': curriculumYear,
      },
    );

    final data = _extractData(res.data);
    if (data is List) {
      return data
          .map((e) => SubjectDto.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<SubjectDto> getSubject(String subjectId) async {
    final res =
        await _client.dio.get(ApiEndpoints.curriculumSubject(subjectId));
    final data = _extractData(res.data);
    return SubjectDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<List<ChapterDto>> listChapters(String subjectId) async {
    final res =
        await _client.dio.get(ApiEndpoints.curriculumChapters(subjectId));
    final data = _extractData(res.data);
    if (data is List) {
      return data
          .map((e) => ChapterDto.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<ChapterDto> getChapter(String chapterId) async {
    final res =
        await _client.dio.get(ApiEndpoints.curriculumChapter(chapterId));
    final data = _extractData(res.data);
    return ChapterDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<List<LessonDto>> listLessons(String chapterId) async {
    final res =
        await _client.dio.get(ApiEndpoints.curriculumLessons(chapterId));
    final data = _extractData(res.data);
    if (data is List) {
      return data
          .map((e) => LessonDto.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<LessonDto> getLesson(String lessonId) async {
    final res = await _client.dio.get(ApiEndpoints.curriculumLesson(lessonId));
    final data = _extractData(res.data);
    return LessonDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<ProgressSummaryDto> getMyProgressSummary() async {
    final res = await _client.dio.get(ApiEndpoints.progressSummary);
    final data = _extractData(res.data);
    return ProgressSummaryDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<List<ChapterProgressDto>> getMySubjectProgress(
      String subjectId) async {
    final res = await _client.dio.get(ApiEndpoints.progressSubject(subjectId));
    final data = _extractData(res.data);
    if (data is Map<String, dynamic> && data['chapters'] is List) {
      return (data['chapters'] as List)
          .map((e) => ChapterProgressDto.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data is List) {
      return data
          .map((e) => ChapterProgressDto.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  }) async {
    final timeSpentMinutes =
        timeSpentSeconds != null ? (timeSpentSeconds / 60).ceil() : null;

    await _client.dio.put(
      ApiEndpoints.progressLesson(lessonId),
      data: {
        'status': completed ? 'completed' : 'in_progress',
        'progressPercent': completed ? 100 : 50,
        if (timeSpentMinutes != null) 'timeSpentMinutes': timeSpentMinutes,
        if (completed) 'completedAt': DateTime.now().toIso8601String(),
        'lastAccessedAt': DateTime.now().toIso8601String(),
      },
    );
  }

  dynamic _extractData(dynamic responseData) {
    return ApiResponseEnvelope.unwrap(responseData);
  }
}
