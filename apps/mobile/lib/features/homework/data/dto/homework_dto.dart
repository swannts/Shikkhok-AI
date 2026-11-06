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
    final original = json['original']?.toString();
    final corrected = json['corrected']?.toString();
    return HomeworkCorrectionStepDto(
      stepNumber: (json['stepNumber'] as num?)?.toInt() ?? 1,
      title: (json['title'] ?? original ?? '').toString(),
      explanation: (json['explanation'] ?? '').toString(),
      isCorrect: (json['isCorrect'] as bool?) ?? false,
      studentStepText: json['studentStepText']?.toString() ?? original,
      suggestedStepText: json['suggestedStepText']?.toString() ?? corrected,
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
  final bool grounded;
  final bool retrievalUnavailable;
  final String groundingMode;
  final List<String> recommendations;

  const HomeworkFeedbackDto({
    required this.submissionId,
    required this.summary,
    required this.detailedExplanation,
    this.steps = const [],
    this.citations = const [],
    this.rating,
    this.grounded = false,
    this.retrievalUnavailable = false,
    this.groundingMode = 'ungrounded',
    this.recommendations = const [],
  });

  factory HomeworkFeedbackDto.fromJson(Map<String, dynamic> json) {
    return HomeworkFeedbackDto(
      submissionId: (json['submissionId'] ?? json['_id'] ?? '').toString(),
      summary: (json['summary'] ?? '').toString(),
      detailedExplanation:
          (json['detailedExplanation'] ?? json['explanation'] ?? '').toString(),
      steps: ((json['steps'] ?? json['corrections']) as List<dynamic>?)
              ?.asMap()
              .entries
              .map((entry) => HomeworkCorrectionStepDto.fromJson({
                    ...entry.value as Map<String, dynamic>,
                    'stepNumber': entry.key + 1,
                  }))
              .toList() ??
          const [],
      citations: (json['citations'] as List<dynamic>?)
              ?.map((e) {
                if (e is String) return e;
                if (e is Map<String, dynamic>) {
                  final book = e['sourceBook'] ?? e['source_book'];
                  final page = e['pageStart'] ?? e['page_start'];
                  if (book is! String || book.trim().isEmpty) return '';
                  return page is num ? '$book · p. ${page.toInt()}' : book;
                }
                return '';
              })
              .where((citation) => citation.isNotEmpty)
              .toList() ??
          const [],
      rating: (json['rating'] as num?)?.toInt(),
      grounded: json['grounded'] == true,
      retrievalUnavailable: json['retrievalUnavailable'] == true ||
          json['retrieval_unavailable'] == true,
      groundingMode:
          (json['groundingMode'] ?? json['grounding_mode'] ?? 'ungrounded')
              .toString(),
      recommendations: (json['recommendations'] as List<dynamic>?)
              ?.whereType<String>()
              .toList() ??
          const [],
    );
  }
}
