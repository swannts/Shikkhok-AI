import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/homework_dto.dart';

abstract class HomeworkRemoteDataSource {
  Future<HomeworkSubmissionDto> createSubmission({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
    String? chapterId,
    String? lessonId,
  });

  Future<List<HomeworkSubmissionDto>> getMySubmissions();

  Future<HomeworkSubmissionDto> getSubmission(String submissionId);

  Future<HomeworkFeedbackDto> getFeedback(String submissionId);

  Future<void> rateFeedback(String submissionId, int rating);

  Future<void> retrySubmission(String submissionId);
}

class HomeworkRemoteDataSourceImpl implements HomeworkRemoteDataSource {
  final ApiClient _apiClient;

  HomeworkRemoteDataSourceImpl([ApiClient? client])
      : _apiClient = client ?? apiClient;

  @override
  Future<HomeworkSubmissionDto> createSubmission({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
    String? chapterId,
    String? lessonId,
  }) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.homeworkSubmissions,
      data: {
        'imageUrls': imageUrls,
        if (prompt != null) 'prompt': prompt,
        if (subjectId != null) 'subjectId': subjectId,
        if (chapterId != null) 'chapterId': chapterId,
        if (lessonId != null) 'lessonId': lessonId,
      },
    );

    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return HomeworkSubmissionDto.fromJson(map);
  }

  @override
  Future<List<HomeworkSubmissionDto>> getMySubmissions() async {
    final response =
        await _apiClient.dio.get(ApiEndpoints.homeworkMySubmissions);
    final raw = response.data;
    final list = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as List<dynamic>
        : (raw is List<dynamic> ? raw : const []);

    return list
        .map((e) => HomeworkSubmissionDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<HomeworkSubmissionDto> getSubmission(String submissionId) async {
    final response =
        await _apiClient.dio.get(ApiEndpoints.homeworkSubmission(submissionId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return HomeworkSubmissionDto.fromJson(map);
  }

  @override
  Future<HomeworkFeedbackDto> getFeedback(String submissionId) async {
    final response =
        await _apiClient.dio.get(ApiEndpoints.homeworkFeedback(submissionId));
    final raw = response.data;
    final map = raw is Map<String, dynamic> && raw.containsKey('data')
        ? raw['data'] as Map<String, dynamic>
        : raw as Map<String, dynamic>;

    return HomeworkFeedbackDto.fromJson(map);
  }

  @override
  Future<void> rateFeedback(String submissionId, int rating) async {
    await _apiClient.dio.post(
      ApiEndpoints.homeworkRateFeedback(submissionId),
      data: {'rating': rating},
    );
  }

  @override
  Future<void> retrySubmission(String submissionId) async {
    await _apiClient.dio.post(ApiEndpoints.homeworkRetry(submissionId));
  }
}
