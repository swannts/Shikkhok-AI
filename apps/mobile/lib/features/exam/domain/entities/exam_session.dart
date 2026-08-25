class ExamSessionQuestion {
  final String id;
  final String prompt;
  final List<String> options;
  final int marks;
  final String? selectedOptionId;
  final bool isFlagged;

  const ExamSessionQuestion({
    required this.id,
    required this.prompt,
    this.options = const [],
    this.marks = 1,
    this.selectedOptionId,
    this.isFlagged = false,
  });

  ExamSessionQuestion copyWith({
    String? selectedOptionId,
    bool? isFlagged,
  }) {
    return ExamSessionQuestion(
      id: id,
      prompt: prompt,
      options: options,
      marks: marks,
      selectedOptionId: selectedOptionId ?? this.selectedOptionId,
      isFlagged: isFlagged ?? this.isFlagged,
    );
  }
}

class ExamSession {
  final String id;
  final String examId;
  final String title;
  final int durationMinutes;
  final DateTime startedAt;
  final DateTime expiresAt;
  final List<ExamSessionQuestion> questions;
  final String status; // active, submitted, expired

  const ExamSession({
    required this.id,
    required this.examId,
    required this.title,
    this.durationMinutes = 30,
    required this.startedAt,
    required this.expiresAt,
    this.questions = const [],
    this.status = 'active',
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  int get answeredCount =>
      questions.where((q) => q.selectedOptionId != null).length;
  int get flaggedCount => questions.where((q) => q.isFlagged).length;
}
