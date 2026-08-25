import '../../domain/entities/homework_submission.dart';
import '../../domain/entities/homework_feedback.dart';
import '../dto/homework_dto.dart';

class HomeworkMapper {
  static HomeworkSubmission toDomainSubmission(HomeworkSubmissionDto dto) {
    return HomeworkSubmission(
      id: dto.id,
      userId: dto.userId,
      imageUrls: dto.imageUrls,
      prompt: dto.prompt,
      subjectId: dto.subjectId,
      status: dto.status,
      createdAt: DateTime.tryParse(dto.createdAt) ?? DateTime.now(),
    );
  }

  static HomeworkCorrectionStep toDomainStep(HomeworkCorrectionStepDto dto) {
    return HomeworkCorrectionStep(
      stepNumber: dto.stepNumber,
      title: dto.title,
      explanation: dto.explanation,
      isCorrect: dto.isCorrect,
      studentStepText: dto.studentStepText,
      suggestedStepText: dto.suggestedStepText,
    );
  }

  static HomeworkFeedback toDomainFeedback(HomeworkFeedbackDto dto) {
    return HomeworkFeedback(
      submissionId: dto.submissionId,
      summary: dto.summary,
      detailedExplanation: dto.detailedExplanation,
      steps: dto.steps.map(toDomainStep).toList(),
      citations: dto.citations,
      rating: dto.rating,
    );
  }
}
