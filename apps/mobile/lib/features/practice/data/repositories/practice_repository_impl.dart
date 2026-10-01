import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/practice_question.dart';
import '../../domain/entities/practice_attempt_result.dart';
import '../../domain/repositories/practice_repository.dart';
import '../datasources/practice_remote_data_source.dart';
import '../mappers/practice_mapper.dart';

class PracticeRepositoryImpl implements PracticeRepository {
  final PracticeRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;

  PracticeRepositoryImpl(this._remoteDataSource, this._apiClient);

  @override
  Future<List<PracticeQuestion>> listQuestions({
    required String lessonId,
    int limit = 10,
    PracticeDifficulty? difficulty,
  }) async {
    try {
      final dtos = await _remoteDataSource.listQuestions(
        lessonId: lessonId,
        limit: limit,
        difficulty: difficulty?.toApiString(),
      );
      return dtos.map(PracticeMapper.toDomainQuestion).toList();
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }

  @override
  Future<PracticeAttemptResult> submitAttempt({
    required String questionId,
    required PracticeQuestionType questionType,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
    num? numericAnswer,
    Map<String, String>? matchingAnswer,
    int? timeSpentSeconds,
  }) async {
    try {
      final dto = await _remoteDataSource.submitAttempt(
        questionId: questionId,
        questionType: questionType.toApiString(),
        selectedOptionId: selectedOptionId,
        selectedOptionIds: selectedOptionIds,
        textAnswer: textAnswer,
        numericAnswer: numericAnswer,
        matchingAnswer: matchingAnswer,
        timeSpentSeconds: timeSpentSeconds,
      );
      return PracticeMapper.toDomainAttemptResult(dto);
    } on DioException catch (e) {
      throw _apiClient.mapDioException(e);
    }
  }
}
