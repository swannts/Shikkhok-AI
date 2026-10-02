import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../core/database/app_database.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/errors/app_failure.dart';
import '../../domain/entities/subject.dart';
import '../../domain/entities/chapter.dart';
import '../../domain/entities/lesson.dart';
import '../../domain/entities/progress_summary.dart';
import '../../domain/repositories/curriculum_repository.dart';
import '../datasources/curriculum_remote_data_source.dart';
import '../mappers/curriculum_mapper.dart';
import '../dto/subject_dto.dart';
import '../dto/chapter_dto.dart';
import '../dto/lesson_dto.dart';

import '../../domain/entities/chapter_progress.dart';

class CurriculumRepositoryImpl implements CurriculumRepository {
  final CurriculumRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;
  final AppDatabase? _database;

  CurriculumRepositoryImpl(this._remoteDataSource, this._apiClient,
      [AppDatabase? database])
      : _database = database;

  Future<void> _putCache(String key, String type, Object payload) async {
    final database = _database;
    if (database == null) return;
    await database.into(database.curriculumCacheTable).insertOnConflictUpdate(
          CurriculumCacheTableCompanion.insert(
            cacheKey: key,
            entityType: type,
            payload: jsonEncode(payload),
            fetchedAt: DateTime.now().toUtc(),
          ),
        );
  }

  Future<dynamic> _readCache(String key, String type) async {
    final database = _database;
    if (database == null) return null;
    final row = await (database.select(database.curriculumCacheTable)
          ..where((table) => table.cacheKey.equals(key)))
        .getSingleOrNull();
    if (row == null) return null;
    return jsonDecode(row.payload);
  }

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
      final result = dtos.map(CurriculumMapper.subjectToDomain).toList();
      await _putCache('subjects:$classLevel:$medium:$curriculumYear',
          'subjects', dtos.map((dto) => dto.toJson()).toList());
      return result;
    } catch (e) {
      final cached = await _readCache(
          'subjects:$classLevel:$medium:$curriculumYear', 'subjects');
      if (cached is List) {
        return cached
            .whereType<Map<String, dynamic>>()
            .map((json) =>
                CurriculumMapper.subjectToDomain(SubjectDto.fromJson(json)))
            .toList();
      }
      if (e is DioException) throw _apiClient.mapDioException(e);
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
      final result = CurriculumMapper.subjectToDomain(dto);
      await _putCache('subject:$subjectId', 'subject', dto.toJson());
      return result;
    } catch (e) {
      final cached = await _readCache('subject:$subjectId', 'subject');
      if (cached is Map<String, dynamic>) {
        return CurriculumMapper.subjectToDomain(SubjectDto.fromJson(cached));
      }
      if (e is DioException) throw _apiClient.mapDioException(e);
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
      final result = dtos.map(CurriculumMapper.chapterToDomain).toList();
      await _putCache('chapters:$subjectId', 'chapters',
          dtos.map((dto) => dto.toJson()).toList());
      return result;
    } catch (e) {
      final cached = await _readCache('chapters:$subjectId', 'chapters');
      if (cached is List) {
        return cached
            .whereType<Map<String, dynamic>>()
            .map((json) =>
                CurriculumMapper.chapterToDomain(ChapterDto.fromJson(json)))
            .toList();
      }
      if (e is DioException) throw _apiClient.mapDioException(e);
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
      final result = CurriculumMapper.chapterToDomain(dto);
      await _putCache('chapter:$chapterId', 'chapter', dto.toJson());
      return result;
    } catch (e) {
      final cached = await _readCache('chapter:$chapterId', 'chapter');
      if (cached is Map<String, dynamic>) {
        return CurriculumMapper.chapterToDomain(ChapterDto.fromJson(cached));
      }
      if (e is DioException) throw _apiClient.mapDioException(e);
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
      final result = dtos.map(CurriculumMapper.lessonToDomain).toList();
      await _putCache('lessons:$chapterId', 'lessons',
          dtos.map((dto) => dto.toJson()).toList());
      return result;
    } catch (e) {
      final cached = await _readCache('lessons:$chapterId', 'lessons');
      if (cached is List) {
        return cached
            .whereType<Map<String, dynamic>>()
            .map((json) =>
                CurriculumMapper.lessonToDomain(LessonDto.fromJson(json)))
            .toList();
      }
      if (e is DioException) throw _apiClient.mapDioException(e);
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
      final result = CurriculumMapper.lessonToDomain(dto);
      await _putCache('lesson:$lessonId', 'lesson', dto.toJson());
      return result;
    } catch (e) {
      final cached = await _readCache('lesson:$lessonId', 'lesson');
      if (cached is Map<String, dynamic>) {
        return CurriculumMapper.lessonToDomain(LessonDto.fromJson(cached));
      }
      if (e is DioException) throw _apiClient.mapDioException(e);
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
