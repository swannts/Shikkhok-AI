class PracticeQuestionDto {
  final String id;
  final String subjectId;
  final String chapterId;
  final String lessonId;
  final String questionType;
  final String prompt;
  final String difficulty;
  final List<String> options;
  final List<String> tags;

  const PracticeQuestionDto({
    required this.id,
    required this.subjectId,
    required this.chapterId,
    required this.lessonId,
    required this.questionType,
    required this.prompt,
    required this.difficulty,
    this.options = const [],
    this.tags = const [],
  });

  factory PracticeQuestionDto.fromJson(Map<String, dynamic> json) {
    return PracticeQuestionDto(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      subjectId: (json['subjectId'] ?? '').toString(),
      chapterId: (json['chapterId'] ?? '').toString(),
      lessonId: (json['lessonId'] ?? '').toString(),
      questionType: (json['questionType'] ?? 'mcq').toString(),
      prompt: (json['prompt'] ?? '').toString(),
      difficulty: (json['difficulty'] ?? 'medium').toString(),
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
              const [],
    );
  }
}

class PracticeAttemptResultDto {
  final String questionId;
  final bool isCorrect;
  final num score;
  final num partialScore;
  final String? feedback;
  final String? explanation;
  final dynamic correctAnswer;
  final int timeSpentSeconds;

  const PracticeAttemptResultDto({
    required this.questionId,
    required this.isCorrect,
    this.score = 0,
    this.partialScore = 0,
    this.feedback,
    this.explanation,
    this.correctAnswer,
    this.timeSpentSeconds = 0,
  });

  factory PracticeAttemptResultDto.fromJson(Map<String, dynamic> json) {
    final attempt = json['attempt'] as Map<String, dynamic>? ?? {};
    return PracticeAttemptResultDto(
      questionId:
          (attempt['questionId'] ?? json['questionId'] ?? '').toString(),
      isCorrect: (json['isCorrect'] as bool?) ??
          (attempt['isCorrect'] as bool?) ??
          false,
      score: (json['score'] as num?) ?? (attempt['score'] as num?) ?? 0,
      partialScore: (json['partialScore'] as num?) ?? 0,
      feedback: json['feedback']?.toString(),
      explanation: json['explanation']?.toString(),
      correctAnswer: json['correctAnswer'],
      timeSpentSeconds: (attempt['timeSpentSeconds'] as num?)?.toInt() ?? 0,
    );
  }
}
