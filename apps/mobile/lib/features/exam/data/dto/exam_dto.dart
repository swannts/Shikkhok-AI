class ExamDto {
  final String id;
  final String title;
  final String? description;
  final String subjectId;
  final String? subjectName;
  final int classLevel;
  final int durationMinutes;
  final int totalMarks;
  final int passingMarks;
  final int questionCount;
  final bool isPublished;

  const ExamDto({
    required this.id,
    required this.title,
    this.description,
    required this.subjectId,
    this.subjectName,
    required this.classLevel,
    this.durationMinutes = 30,
    this.totalMarks = 50,
    this.passingMarks = 20,
    this.questionCount = 25,
    this.isPublished = true,
  });

  factory ExamDto.fromJson(Map<String, dynamic> json) {
    return ExamDto(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      subjectId: (json['subjectId'] ?? '').toString(),
      subjectName: json['subjectName']?.toString(),
      classLevel: (json['classLevel'] as num?)?.toInt() ?? 8,
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 30,
      totalMarks: (json['totalMarks'] as num?)?.toInt() ?? 50,
      passingMarks: (json['passingMarks'] as num?)?.toInt() ?? 20,
      questionCount: (json['questionCount'] as num?)?.toInt() ??
          (json['questions'] as List<dynamic>?)?.length ??
          25,
      isPublished: (json['isPublished'] as bool?) ?? true,
    );
  }
}

class ExamSessionQuestionDto {
  final String id;
  final String prompt;
  final List<String> options;
  final int marks;
  final String? selectedOptionId;
  final bool isFlagged;

  const ExamSessionQuestionDto({
    required this.id,
    required this.prompt,
    this.options = const [],
    this.marks = 1,
    this.selectedOptionId,
    this.isFlagged = false,
  });

  factory ExamSessionQuestionDto.fromJson(Map<String, dynamic> json) {
    return ExamSessionQuestionDto(
      id: (json['id'] ?? json['_id'] ?? json['questionId'] ?? '').toString(),
      prompt: (json['prompt'] ?? '').toString(),
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      marks: (json['marks'] as num?)?.toInt() ?? 1,
      selectedOptionId: json['selectedOptionId']?.toString(),
      isFlagged: (json['isFlagged'] as bool?) ?? false,
    );
  }
}

class ExamSessionDto {
  final String id;
  final String examId;
  final String title;
  final int durationMinutes;
  final String startedAt;
  final String expiresAt;
  final List<ExamSessionQuestionDto> questions;
  final String status;

  const ExamSessionDto({
    required this.id,
    required this.examId,
    required this.title,
    this.durationMinutes = 30,
    required this.startedAt,
    required this.expiresAt,
    this.questions = const [],
    this.status = 'active',
  });

  factory ExamSessionDto.fromJson(Map<String, dynamic> json) {
    return ExamSessionDto(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      examId: (json['examId'] ?? '').toString(),
      title: (json['title'] ?? 'পরীক্ষা').toString(),
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 30,
      startedAt:
          (json['startedAt'] ?? DateTime.now().toIso8601String()).toString(),
      expiresAt: (json['expiresAt'] ??
              DateTime.now().add(const Duration(minutes: 30)).toIso8601String())
          .toString(),
      questions: (json['questions'] as List<dynamic>?)
              ?.map((e) =>
                  ExamSessionQuestionDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      status: (json['status'] ?? 'active').toString(),
    );
  }
}

class ExamResultDto {
  final String sessionId;
  final String examId;
  final String title;
  final num score;
  final num totalMarks;
  final num percentage;
  final bool isPassed;
  final int totalQuestions;
  final int correctAnswers;
  final int incorrectAnswers;
  final int unattempted;
  final int timeSpentSeconds;

  const ExamResultDto({
    required this.sessionId,
    required this.examId,
    required this.title,
    required this.score,
    required this.totalMarks,
    required this.percentage,
    required this.isPassed,
    this.totalQuestions = 0,
    this.correctAnswers = 0,
    this.incorrectAnswers = 0,
    this.unattempted = 0,
    this.timeSpentSeconds = 0,
  });

  factory ExamResultDto.fromJson(Map<String, dynamic> json) {
    return ExamResultDto(
      sessionId: (json['sessionId'] ?? json['_id'] ?? '').toString(),
      examId: (json['examId'] ?? '').toString(),
      title: (json['title'] ?? 'পরীক্ষার ফলাফল').toString(),
      score: (json['score'] ?? json['totalScore'] ?? 0) as num,
      totalMarks: (json['totalMarks'] ?? 50) as num,
      percentage: (json['percentage'] ?? 0) as num,
      isPassed: (json['isPassed'] as bool?) ?? false,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      correctAnswers: (json['correctAnswers'] as num?)?.toInt() ?? 0,
      incorrectAnswers: (json['incorrectAnswers'] as num?)?.toInt() ?? 0,
      unattempted: (json['unattempted'] as num?)?.toInt() ?? 0,
      timeSpentSeconds: (json['timeSpentSeconds'] as num?)?.toInt() ?? 0,
    );
  }
}
