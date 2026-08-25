import '../entities/practice_question.dart';
import '../entities/practice_attempt_result.dart';

abstract class PracticeRepository {
  Future<List<PracticeQuestion>> listQuestions({
    required String lessonId,
    int limit = 10,
    PracticeDifficulty? difficulty,
  });

  Future<PracticeAttemptResult> submitAttempt({
    required String questionId,
    required PracticeQuestionType questionType,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
    num? numericAnswer,
    Map<String, String>? matchingAnswer,
    int? timeSpentSeconds,
  });
}
