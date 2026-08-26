import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/errors/app_failure.dart';
import '../../domain/entities/subject.dart';
import '../../domain/entities/chapter.dart';
import '../../domain/entities/lesson.dart';
import '../../domain/entities/progress_summary.dart';
import '../../domain/repositories/curriculum_repository.dart';
import '../datasources/curriculum_remote_data_source.dart';
import '../mappers/curriculum_mapper.dart';

import '../../domain/entities/chapter_progress.dart';

class CurriculumRepositoryImpl implements CurriculumRepository {
  final CurriculumRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  CurriculumRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<List<Subject>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  }) async {
    try {
      final dtos = await _remoteDataSource.listSubjects(
        classLevel: classLevel,
        medium: medium,
        curriculumYear: curriculumYear,
      );
      return dtos.map(CurriculumMapper.subjectToDomain).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'বিষয় তালিকা আনতে সমস্যা হয়েছে।',
      );
    }
  }

  @override
  Future<Subject> getSubject(String subjectId) async {
    try {
      final dto = await _remoteDataSource.getSubject(subjectId);
      return CurriculumMapper.subjectToDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'বিষয়ের তথ্য আনতে সমস্যা হয়েছে।',
      );
    }
  }

  @override
  Future<List<Chapter>> listChapters(String subjectId) async {
    try {
      final dtos = await _remoteDataSource.listChapters(subjectId);
      return dtos.map(CurriculumMapper.chapterToDomain).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'অধ্যায় তালিকা আনতে সমস্যা হয়েছে।',
      );
    }
  }

  @override
  Future<Chapter> getChapter(String chapterId) async {
    try {
      final dto = await _remoteDataSource.getChapter(chapterId);
      return CurriculumMapper.chapterToDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'অধ্যায়ের তথ্য আনা যায়নি।',
      );
    }
  }

  @override
  Future<List<Lesson>> listLessons(String chapterId) async {
    try {
      final dtos = await _remoteDataSource.listLessons(chapterId);
      return dtos.map(CurriculumMapper.lessonToDomain).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'পাঠ তালিকা আনতে সমস্যা হয়েছে।',
      );
    }
  }

  @override
  Future<Lesson> getLesson(String lessonId) async {
    try {
      final dto = await _remoteDataSource.getLesson(lessonId);
      return CurriculumMapper.lessonToDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'পাঠের তথ্য আনা যায়নি।',
      );
    }
  }

  @override
  Future<ProgressSummary> getMyProgressSummary() async {
    try {
      final dto = await _remoteDataSource.getMyProgressSummary();
      return CurriculumMapper.progressSummaryToDomain(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw const ProgressSummary();
    }
  }

  @override
  Future<List<ChapterProgress>> getMySubjectProgress(String subjectId) async {
    try {
      final dtos = await _remoteDataSource.getMySubjectProgress(subjectId);
      return dtos.map((d) => d.toDomain()).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'অধ্যায়ের অগ্রগতি আনা যায়নি।',
      );
    }
  }

  @override
  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  }) async {
    try {
      await _remoteDataSource.updateLessonProgress(
        lessonId: lessonId,
        completed: completed,
        timeSpentSeconds: timeSpentSeconds,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw UnknownFailure(
        message: e.toString(),
        banglaMessage: 'প্রগ্রেস সংরক্ষণ করা সম্ভব হয়নি।',
      );
    }
  }
}
