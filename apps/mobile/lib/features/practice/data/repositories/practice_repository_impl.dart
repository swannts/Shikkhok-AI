import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/practice_question.dart';
import '../../domain/entities/practice_attempt_result.dart';
import '../../domain/repositories/practice_repository.dart';
import '../datasources/practice_remote_data_source.dart';
import '../mappers/practice_mapper.dart';
import '../../../../core/sync/sync_engine.dart';


class PracticeRepositoryImpl implements PracticeRepository {
  final PracticeRemoteDataSource _remoteDataSource;
  final ApiClient _apiClient;
  final SyncEngine? _syncEngine;

  PracticeRepositoryImpl(this._remoteDataSource, this._apiClient,
      [this._syncEngine]);

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
    final payload = {
      'questionId': questionId,
      'questionType': questionType.toApiString(),
      if (selectedOptionId != null) 'selectedOptionId': selectedOptionId,
      if (selectedOptionIds != null) 'selectedOptionIds': selectedOptionIds,
      if (textAnswer != null) 'textAnswer': textAnswer,
      if (numericAnswer != null) 'numericAnswer': numericAnswer,
      if (matchingAnswer != null) 'matchingAnswer': matchingAnswer,
      if (timeSpentSeconds != null) 'timeSpentSeconds': timeSpentSeconds,
    };

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
      // Offline fallback: enqueue mutation and return an optimistic result
      if (_syncEngine != null && _apiClient.isNetworkError(e)) {
        await _syncEngine!.enqueueMutation(
          operationType: 'create',
          entityType: 'practice_attempt',
          payload: payload,
        );

        // Note: For MCQ, we cannot strictly know if it is correct offline without the key,
        // so we return an un-evaluated optimistic result (isCorrect: false or null conceptually,
        // but schema requires non-null so we guess false).
        // A true offline app would store correct options locally if allowed.
        return PracticeAttemptResult(
          questionId: questionId,
          isCorrect: false,
          explanation: 'অফলাইন মোডে উত্তর জমা হয়েছে। ইন্টারনেট সংযোগ পেলে সঠিক উত্তর দেখা যাবে।',
          score: 0,
        );
      }
      throw _apiClient.mapDioException(e);
    }
  }
}
