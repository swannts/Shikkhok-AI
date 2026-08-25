class HomeworkCorrectionStep {
  final int stepNumber;
  final String title;
  final String explanation;
  final bool isCorrect;
  final String? studentStepText;
  final String? suggestedStepText;

  const HomeworkCorrectionStep({
    required this.stepNumber,
    required this.title,
    required this.explanation,
    this.isCorrect = true,
    this.studentStepText,
    this.suggestedStepText,
  });
}

class HomeworkFeedback {
  final String submissionId;
  final String summary;
  final String detailedExplanation;
  final List<HomeworkCorrectionStep> steps;
  final List<String> citations;
  final int? rating;

  const HomeworkFeedback({
    required this.submissionId,
    required this.summary,
    required this.detailedExplanation,
    this.steps = const [],
    this.citations = const [],
    this.rating,
  });
}
