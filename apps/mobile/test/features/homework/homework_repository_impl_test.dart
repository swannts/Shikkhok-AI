import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/homework/data/datasources/homework_remote_data_source.dart';
import 'package:mobile/features/homework/data/dto/homework_dto.dart';
import 'package:mobile/features/homework/data/repositories/homework_repository_impl.dart';

class MockHomeworkRemoteDataSource implements HomeworkRemoteDataSource {
  @override
  Future<HomeworkSubmissionDto> createSubmission({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
    String? chapterId,
    String? lessonId,
  }) async {
    return HomeworkSubmissionDto(
      id: 'sub-1',
      userId: 'user-1',
      imageUrls: imageUrls,
      prompt: prompt,
      subjectId: subjectId,
      status: 'queued',
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  @override
  Future<List<HomeworkSubmissionDto>> getMySubmissions() async {
    return [
      HomeworkSubmissionDto(
        id: 'sub-1',
        userId: 'user-1',
        imageUrls: const ['https://img.jpg'],
        status: 'completed',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  @override
  Future<HomeworkSubmissionDto> getSubmission(String submissionId) async {
    return HomeworkSubmissionDto(
      id: submissionId,
      userId: 'user-1',
      imageUrls: const ['https://img.jpg'],
      status: 'completed',
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  @override
  Future<HomeworkFeedbackDto> getFeedback(String submissionId) async {
    return HomeworkFeedbackDto(
      submissionId: submissionId,
      summary: 'গণিত সমস্যার সঠিক সমাধান',
      detailedExplanation: 'ধাপ ১: উভয় পক্ষে ৬ বিয়োগ করুন...',
      steps: const [
        HomeworkCorrectionStepDto(
          stepNumber: 1,
          title: 'সমীকরণ তৈরি',
          explanation: 'সঠিক',
          isCorrect: true,
        ),
      ],
    );
  }

  @override
  Future<void> rateFeedback(String submissionId, int rating) async {}

  @override
  Future<void> retrySubmission(String submissionId) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('HomeworkRepositoryImpl Unit Tests', () {
    late HomeworkRepositoryImpl repository;
    late MockHomeworkRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockHomeworkRemoteDataSource();
      apiClient = ApiClient();
      repository = HomeworkRepositoryImpl(mockDataSource, apiClient);
    });

    test('createSubmission returns mapped HomeworkSubmission', () async {
      final submission = await repository.createSubmission(
        imageUrls: const ['https://img.jpg'],
        prompt: 'Solve question 3',
      );

      expect(submission.id, 'sub-1');
      expect(submission.imageUrls, contains('https://img.jpg'));
    });

    test('getFeedback returns mapped HomeworkFeedback', () async {
      final feedback = await repository.getFeedback('sub-1');

      expect(feedback.submissionId, 'sub-1');
      expect(feedback.summary, contains('সঠিক সমাধান'));
      expect(feedback.steps.length, 1);
    });
  });
}
