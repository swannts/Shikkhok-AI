class PracticeAttemptResult {
  final String questionId;
  final bool isCorrect;
  final num score;
  final num partialScore;
  final String? feedback;
  final String? explanation;
  final dynamic correctAnswer;
  final int timeSpentSeconds;

  const PracticeAttemptResult({
    required this.questionId,
    required this.isCorrect,
    this.score = 0,
    this.partialScore = 0,
    this.feedback,
    this.explanation,
    this.correctAnswer,
    this.timeSpentSeconds = 0,
  });
}
