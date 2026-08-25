class HomeworkSubmissionDto {
  final String id;
  final String userId;
  final List<String> imageUrls;
  final String? prompt;
  final String? subjectId;
  final String status;
  final String createdAt;

  const HomeworkSubmissionDto({
    required this.id,
    required this.userId,
    required this.imageUrls,
    this.prompt,
    this.subjectId,
    required this.status,
    required this.createdAt,
  });

  factory HomeworkSubmissionDto.fromJson(Map<String, dynamic> json) {
    return HomeworkSubmissionDto(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      imageUrls: (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      prompt: json['prompt']?.toString(),
      subjectId: json['subjectId']?.toString(),
      status: (json['status'] ?? 'queued').toString(),
      createdAt:
          (json['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
    );
  }
}

class HomeworkCorrectionStepDto {
  final int stepNumber;
  final String title;
  final String explanation;
  final bool isCorrect;
  final String? studentStepText;
  final String? suggestedStepText;

  const HomeworkCorrectionStepDto({
    required this.stepNumber,
    required this.title,
    required this.explanation,
    this.isCorrect = true,
    this.studentStepText,
    this.suggestedStepText,
  });

  factory HomeworkCorrectionStepDto.fromJson(Map<String, dynamic> json) {
    return HomeworkCorrectionStepDto(
      stepNumber: (json['stepNumber'] as num?)?.toInt() ?? 1,
      title: (json['title'] ?? '').toString(),
      explanation: (json['explanation'] ?? '').toString(),
      isCorrect: (json['isCorrect'] as bool?) ?? true,
      studentStepText: json['studentStepText']?.toString(),
      suggestedStepText: json['suggestedStepText']?.toString(),
    );
  }
}

class HomeworkFeedbackDto {
  final String submissionId;
  final String summary;
  final String detailedExplanation;
  final List<HomeworkCorrectionStepDto> steps;
  final List<String> citations;
  final int? rating;

  const HomeworkFeedbackDto({
    required this.submissionId,
    required this.summary,
    required this.detailedExplanation,
    this.steps = const [],
    this.citations = const [],
    this.rating,
  });

  factory HomeworkFeedbackDto.fromJson(Map<String, dynamic> json) {
    return HomeworkFeedbackDto(
      submissionId: (json['submissionId'] ?? json['_id'] ?? '').toString(),
      summary: (json['summary'] ?? '').toString(),
      detailedExplanation:
          (json['detailedExplanation'] ?? json['explanation'] ?? '').toString(),
      steps: (json['steps'] as List<dynamic>?)
              ?.map((e) =>
                  HomeworkCorrectionStepDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      citations: (json['citations'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      rating: (json['rating'] as num?)?.toInt(),
    );
  }
}
