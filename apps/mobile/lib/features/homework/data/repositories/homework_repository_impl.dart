import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/homework_submission.dart';
import '../../domain/entities/homework_feedback.dart';
import '../../domain/repositories/homework_repository.dart';
import '../datasources/homework_remote_data_source.dart';
import '../mappers/homework_mapper.dart';

class HomeworkRepositoryImpl implements HomeworkRepository {
  final HomeworkRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  HomeworkRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<HomeworkSubmission> createSubmission({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
    String? chapterId,
    String? lessonId,
  }) async {
    try {
      final dto = await _remoteDataSource.createSubmission(
        imageUrls: imageUrls,
        prompt: prompt,
        subjectId: subjectId,
        chapterId: chapterId,
        lessonId: lessonId,
      );
      return HomeworkMapper.toDomainSubmission(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<List<HomeworkSubmission>> getMySubmissions() async {
    try {
      final dtos = await _remoteDataSource.getMySubmissions();
      return dtos.map(HomeworkMapper.toDomainSubmission).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<HomeworkSubmission> getSubmission(String submissionId) async {
    try {
      final dto = await _remoteDataSource.getSubmission(submissionId);
      return HomeworkMapper.toDomainSubmission(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<HomeworkFeedback> getFeedback(String submissionId) async {
    try {
      final dto = await _remoteDataSource.getFeedback(submissionId);
      return HomeworkMapper.toDomainFeedback(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> rateFeedback(String submissionId, int rating) async {
    try {
      await _remoteDataSource.rateFeedback(submissionId, rating);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> retrySubmission(String submissionId) async {
    try {
      await _remoteDataSource.retrySubmission(submissionId);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
