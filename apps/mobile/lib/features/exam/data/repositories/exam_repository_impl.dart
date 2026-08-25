import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/exam_model.dart';
import '../../domain/entities/exam_session.dart';
import '../../domain/entities/exam_result.dart';
import '../../domain/repositories/exam_repository.dart';
import '../datasources/exam_remote_data_source.dart';
import '../mappers/exam_mapper.dart';

class ExamRepositoryImpl implements ExamRepository {
  final ExamRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  ExamRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<List<ExamModel>> listExams({
    int? classLevel,
    String? subjectId,
  }) async {
    try {
      final dtos = await _remoteDataSource.listExams(
        classLevel: classLevel,
        subjectId: subjectId,
      );
      return dtos.map(ExamMapper.toDomainExam).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<ExamModel> getExam(String examId) async {
    try {
      final dto = await _remoteDataSource.getExam(examId);
      return ExamMapper.toDomainExam(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<ExamSession> startSession(String examId) async {
    try {
      final dto = await _remoteDataSource.startSession(examId);
      return ExamMapper.toDomainSession(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<ExamSession> getSession(String sessionId) async {
    try {
      final dto = await _remoteDataSource.getSession(sessionId);
      return ExamMapper.toDomainSession(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> saveAnswer({
    required String sessionId,
    required String questionId,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
  }) async {
    try {
      await _remoteDataSource.saveAnswer(
        sessionId: sessionId,
        questionId: questionId,
        selectedOptionId: selectedOptionId,
        selectedOptionIds: selectedOptionIds,
        textAnswer: textAnswer,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<void> flagQuestion({
    required String sessionId,
    required String questionId,
    required bool isFlagged,
  }) async {
    try {
      await _remoteDataSource.flagQuestion(
        sessionId: sessionId,
        questionId: questionId,
        isFlagged: isFlagged,
      );
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<ExamResult> submitSession(String sessionId) async {
    try {
      final dto = await _remoteDataSource.submitSession(sessionId);
      return ExamMapper.toDomainResult(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<ExamResult> getSessionResult(String sessionId) async {
    try {
      final dto = await _remoteDataSource.getSessionResult(sessionId);
      return ExamMapper.toDomainResult(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
