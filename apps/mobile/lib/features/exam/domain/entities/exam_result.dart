class ExamResult {
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

  const ExamResult({
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
}
