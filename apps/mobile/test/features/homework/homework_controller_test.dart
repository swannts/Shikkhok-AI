import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/homework/domain/entities/homework_submission.dart';
import 'package:mobile/features/homework/domain/entities/homework_feedback.dart';
import 'package:mobile/features/homework/domain/repositories/homework_repository.dart';
import 'package:mobile/features/homework/presentation/controllers/homework_controller.dart';

class FakeHomeworkRepository implements HomeworkRepository {
  @override
  Future<HomeworkSubmission> createSubmission({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
    String? chapterId,
    String? lessonId,
  }) async {
    return HomeworkSubmission(
      id: 'sub-1',
      userId: 'user-1',
      imageUrls: imageUrls,
      prompt: prompt,
      status: 'queued',
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<List<HomeworkSubmission>> getMySubmissions() async {
    return [
      HomeworkSubmission(
        id: 'sub-1',
        userId: 'user-1',
        imageUrls: const ['https://img.jpg'],
        status: 'completed',
        createdAt: DateTime.now(),
      ),
    ];
  }

  @override
  Future<HomeworkSubmission> getSubmission(String submissionId) async {
    return HomeworkSubmission(
      id: submissionId,
      userId: 'user-1',
      imageUrls: const ['https://img.jpg'],
      status: 'completed',
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<HomeworkFeedback> getFeedback(String submissionId) async {
    return HomeworkFeedback(
      submissionId: submissionId,
      summary: 'গণিত সমস্যার সঠিক সমাধান',
      detailedExplanation: 'ধাপ ১: উভয় পক্ষে ৬ বিয়োগ করুন...',
      steps: const [
        HomeworkCorrectionStep(
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

  group('HomeworkController Unit Tests', () {
    late HomeworkController controller;
    late FakeHomeworkRepository repository;

    setUp(() {
      repository = FakeHomeworkRepository();
      controller = HomeworkController(repository);
    });

    test('Initial state is HomeworkInitial', () {
      expect(controller.state, isA<HomeworkInitial>());
    });

    test('loadSubmissions loads list and sets HomeworkListLoaded', () async {
      await controller.loadSubmissions();

      expect(controller.state, isA<HomeworkListLoaded>());
      final loaded = controller.state as HomeworkListLoaded;
      expect(loaded.submissions.length, 1);
    });

    test('loadFeedback loads submission and feedback', () async {
      await controller.loadFeedback('sub-1');

      expect(controller.state, isA<HomeworkFeedbackLoaded>());
      final loaded = controller.state as HomeworkFeedbackLoaded;
      expect(loaded.feedback.summary, contains('সঠিক সমাধান'));
    });
  });
}
