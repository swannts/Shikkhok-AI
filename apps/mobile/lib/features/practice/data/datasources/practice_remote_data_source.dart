import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/practice_question_dto.dart';

abstract class PracticeRemoteDataSource {
  Future<List<PracticeQuestionDto>> listQuestions({
    required String lessonId,
    int limit = 10,
    String? difficulty,
  });

  Future<PracticeAttemptResultDto> submitAttempt({
    required String questionId,
    required String questionType,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
    num? numericAnswer,
    Map<String, String>? matchingAnswer,
    int? timeSpentSeconds,
  });
}

class PracticeRemoteDataSourceImpl implements PracticeRemoteDataSource {
  final ApiClient _apiClient;

  PracticeRemoteDataSourceImpl([ApiClient? apiClientInstance])
      : _apiClient = apiClientInstance ?? apiClient;

  @override
  Future<List<PracticeQuestionDto>> listQuestions({
    required String lessonId,
    int limit = 10,
    String? difficulty,
  }) async {
    final response = await _apiClient.dio.get(
      ApiEndpoints.practiceLessonQuestions(lessonId),
      queryParameters: {
        'limit': limit,
        if (difficulty != null) 'difficulty': difficulty,
      },
    );

    final raw = response.data;
    final list = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as List<dynamic>
        : (raw is List<dynamic> ? raw : const []);

    return list
        .map((e) => PracticeQuestionDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<PracticeAttemptResultDto> submitAttempt({
    required String questionId,
    required String questionType,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
    num? numericAnswer,
    Map<String, String>? matchingAnswer,
    int? timeSpentSeconds,
  }) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.practiceSubmit,
      data: {
        'questionId': questionId,
        'questionType': questionType,
        if (selectedOptionId != null) 'selectedOptionId': selectedOptionId,
        if (selectedOptionIds != null) 'selectedOptionIds': selectedOptionIds,
        if (textAnswer != null) 'textAnswer': textAnswer,
        if (numericAnswer != null) 'numericAnswer': numericAnswer,
        if (matchingAnswer != null) 'matchingAnswer': matchingAnswer,
        if (timeSpentSeconds != null) 'timeSpentSeconds': timeSpentSeconds,
      },
    );

    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : (raw is Map<String, dynamic> ? raw : <String, dynamic>{});

    return PracticeAttemptResultDto.fromJson(map);
  }
}
