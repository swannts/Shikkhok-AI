import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/exam_dto.dart';

abstract class ExamRemoteDataSource {
  Future<List<ExamDto>> listExams({
    int? classLevel,
    String? subjectId,
  });

  Future<ExamDto> getExam(String examId);

  Future<ExamSessionDto> startSession(String examId);

  Future<ExamSessionDto> getSession(String sessionId);

  Future<void> saveAnswer({
    required String sessionId,
    required String questionId,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
  });

  Future<void> flagQuestion({
    required String sessionId,
    required String questionId,
    required bool isFlagged,
  });

  Future<ExamResultDto> submitSession(String sessionId);

  Future<ExamResultDto> getSessionResult(String sessionId);
}

class ExamRemoteDataSourceImpl implements ExamRemoteDataSource {
  final ApiClient _apiClient;

  ExamRemoteDataSourceImpl([ApiClient? client])
      : _apiClient = client ?? apiClient;

  @override
  Future<List<ExamDto>> listExams({
    int? classLevel,
    String? subjectId,
  }) async {
    final response = await _apiClient.dio.get(
      ApiEndpoints.exams,
      queryParameters: {
        if (classLevel != null) 'classLevel': classLevel,
        if (subjectId != null) 'subjectId': subjectId,
        'status': 'published',
      },
    );

    final raw = response.data;
    final list = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as List<dynamic>
        : (raw is List<dynamic> ? raw : const []);

    return list
        .map((e) => ExamDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ExamDto> getExam(String examId) async {
    final response = await _apiClient.dio.get(ApiEndpoints.exam(examId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return ExamDto.fromJson(map);
  }

  @override
  Future<ExamSessionDto> startSession(String examId) async {
    final response = await _apiClient.dio.post(ApiEndpoints.examStart(examId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return ExamSessionDto.fromJson(map);
  }

  @override
  Future<ExamSessionDto> getSession(String sessionId) async {
    final response =
        await _apiClient.dio.get(ApiEndpoints.examSession(sessionId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return ExamSessionDto.fromJson(map);
  }

  @override
  Future<void> saveAnswer({
    required String sessionId,
    required String questionId,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
  }) async {
    await _apiClient.dio.put(
      ApiEndpoints.examSessionAnswer(sessionId, questionId),
      data: {
        if (selectedOptionId != null) 'selectedOptionId': selectedOptionId,
        if (selectedOptionIds != null) 'selectedOptionIds': selectedOptionIds,
        if (textAnswer != null) 'textAnswer': textAnswer,
      },
    );
  }

  @override
  Future<void> flagQuestion({
    required String sessionId,
    required String questionId,
    required bool isFlagged,
  }) async {
    await _apiClient.dio.post(
      ApiEndpoints.examSessionFlag(sessionId, questionId),
      data: {'isFlagged': isFlagged},
    );
  }

  @override
  Future<ExamResultDto> submitSession(String sessionId) async {
    final response =
        await _apiClient.dio.post(ApiEndpoints.examSessionSubmit(sessionId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return ExamResultDto.fromJson(map);
  }

  @override
  Future<ExamResultDto> getSessionResult(String sessionId) async {
    final response =
        await _apiClient.dio.get(ApiEndpoints.examSessionResult(sessionId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return ExamResultDto.fromJson(map);
  }
}
