import '../entities/homework_submission.dart';
import '../entities/homework_feedback.dart';

abstract class HomeworkRepository {
  Future<HomeworkSubmission> createSubmission({
    required List<String> imageUrls,
    String? prompt,
    String? subjectId,
    String? chapterId,
    String? lessonId,
  });

  Future<List<HomeworkSubmission>> getMySubmissions();

  Future<HomeworkSubmission> getSubmission(String submissionId);

  Future<HomeworkFeedback> getFeedback(String submissionId);

  Future<void> rateFeedback(String submissionId, int rating);

  Future<void> retrySubmission(String submissionId);
}
